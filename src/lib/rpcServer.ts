import crypto from 'node:crypto';
import Link from 'grenache-nodejs-link';
import { PeerRPCClient, PeerRPCServer, PeerPub, PeerSub } from 'grenache-nodejs-ws';
import _ from 'lodash';
import { scenarioDefault } from '../scenarios/scenarios';
import { ANNOUNCE_COMMANDS, WORKER_NAME } from './consts';
import {
  ERequestType,
  IAuction,
  IRequestPayload,
  IRequestPayloadWithoutSender,
  IResponsePayload,
  IResponsePayloadWithoutSender,
  IScenario,
} from './interfaces';
import { RPCPeer } from './rpc';

export class RPCServer {
  private _link: Link;
  private _server: PeerRPCServer;
  private _port: number;
  private _peersStorage: RPCPeer[] = [];
  private _id: string;

  public constructor(link) {
    this._link = link;
    this._id = crypto.randomUUID();
    console.debug(`This server id: ${this._id}`);
    this.refreshRPCList();
  }

  public get port() {
    return this._port;
  }

  private async processRequest(request: IRequestPayload): Promise<IResponsePayloadWithoutSender> {
    if (this._scenario) {
      console.debug(`Process request ${JSON.stringify(request)} with scenario`);
      const data = await this._scenario(request, this._id);
      console.debug(`Result: ${JSON.stringify(data)}`);
      return data;
    } else {
      console.debug(`Process request ${JSON.stringify(request)}`);
      switch (request.type) {
        case ERequestType.bid: {
          if (!this._auction || this._auction.id !== request.data.auctionId) {
            return null;
          }
          const { price } = request.data;
          if (price < this._auction.price) {
            throw new Error(`Bid price is too low`);
          }
          if (this._auction.bids.length > 0 && price <= _.last(this._auction.bids).price) {
            throw new Error(`Bid price need to be higher than previous bid`);
          }
          console.debug(`Bid price accepted: ${price}`);
          this._auction.bids.push({
            bidder: request.sender,
            price,
          });
          this._auction.price = price;
          return {
            type: ERequestType.bid_accepted,
            data: {
              price,
              recipient: request.sender,
              auctionId: this._auction.id,
            },
          };
        }
      }
    }
  }

  public async start(port?: number, interval = 10000) {
    if (!port) {
      port = _.random(10000, 11000);
    }
    this._port = port;
    const peer = new PeerRPCServer(this._link, {});
    peer.init();

    this._server = peer.transport('server');
    this._server.listen(port);

    const instanceName = `${WORKER_NAME}:${this._port}`;

    setInterval(() => {
      this._link.announce(instanceName, this._port, {});
    }, 1000);

    this._server.on('request', async (rid, key, payload: IRequestPayload, handler) => {
      /** @todo Self requests processing */
      if (payload.sender === this._id) {
        return;
      }
      try {
        const result = await this.processRequest(payload);
        if (result) {
          void this.makeAnnouncement(result);
        }
      } catch (err) {
        handler.reply(err);
      }
    });

    // Init announcement
    this._link.startAnnouncing(
      ANNOUNCE_COMMANDS.started,
      port,
      {
        interval,
      },
      (err) => {
        if (err) {
          throw err;
        }
      },
    );

    // Add itself to list
    await this.checkAndAddPeer(`127.0.0.1:${this._port}`);
    this.printPeers();

    return this;
  }

  public makeAnnouncement = async (data: IRequestPayloadWithoutSender) => {
    const payload: IRequestPayload = {
      ...data,
      sender: this._id,
    };
    await Promise.all(
      this._peersStorage
        /** @todo Remove itself from list */
        .filter((peer) => peer.port !== this.port)
        .map(async (peer) => {
          try {
            await peer.sendMessage(payload);
            console.debug(`Sent ${JSON.stringify(data)} to ${peer.instanceName}`);
          } catch (err) {
            console.info(`Cant send ${JSON.stringify(data)} to ${peer.instanceName}`);
          }
        }),
    );
  };

  public refreshRPCList() {
    this._link.lookup(ANNOUNCE_COMMANDS.started, {}, async (err, _peers: string[] = []) => {
      if (err) {
        /** @todo dont ignore all errors but not for now */
        return false;
        throw err;
      }

      for await (const connectionLine of _peers) {
        await this.checkAndAddPeer(connectionLine);
      }

      this.printPeers();
    });
  }

  private async checkAndAddPeer(connectLine: string) {
    // eslint-disable-next-line arrow-body-style
    const isExists = this._peersStorage.find((p) => {
      return p.connectLine === connectLine;
    });
    if (!isExists) {
      const peer = new RPCPeer(this._link, connectLine);
      if (await peer.isAvaiable()) {
        this._peersStorage.push(peer);
      }
    }
  }

  private printPeers() {
    const output = this._peersStorage.map((p) => p.connectLine).join(', ');
    console.log(`Peers available: ${output}`);
    return output;
  }

  /**
   * High level methods to handle auction
   */
  private _auction: IAuction;
  public startAuction = async (picId: string, startingPrice = 0, timeoutInSeconds = 15) => {
    this._auction = {
      id: crypto.randomUUID(),
      picId,
      picName: `Pic #${picId}`,
      price: startingPrice,
      endTime: Date.now() + timeoutInSeconds,
      bids: [],
    };

    setTimeout(() => {
      void this.endAuction();
    }, timeoutInSeconds * 1000);

    await this.makeAnnouncement({
      type: ERequestType.auction_start,
      data: {
        auctionId: this._auction.id,
        picId,
        picName: `Pic #${picId}`,
        price: startingPrice,
        endTime: this._auction.endTime,
      },
    });

    console.debug(`Auction started: ${JSON.stringify(this._auction)}. Timeout: ${timeoutInSeconds} seconds`);
  };

  public endAuction = async () => {
    if (this._auction) {
      const bid = _.last(this._auction.bids);
      const recipient = bid ? bid.bidder : null;
      const auctionId = this._auction.id;
      this._auction = null;
      await this.makeAnnouncement({
        type: ERequestType.auction_end,
        data: {
          auctionId,
          recipient,
        },
      });
      console.debug(`Auction ended: ${JSON.stringify(auctionId)}. Winner: ${recipient}`);
    }
  };

  private _scenario: IScenario;
  public applyScenario = (scenario: IScenario) => {
    this._scenario = scenario;
  };
}
