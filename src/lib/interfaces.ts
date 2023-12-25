export enum ERequestType {
  'auction_start' = 'auction_start',
  'bid' = 'bid',
  'bid_accepted' = 'bid_accepted',
  'auction_end' = 'auction_end',
}

export type IScenario = (
  data: IRequestPayload,
  myId?: string,
) => PromiseLike<IResponsePayloadWithoutSender | undefined>;

export interface IBid {
  bidder: string;
  price: number;
}

export interface IAuction {
  id: string;
  picId: string;
  picName: string;
  price: number;
  endTime: number;
  bids: IBid[];
}

export interface IRequestPayloadWithoutSender {
  type: ERequestType;
  data?: {
    auctionId?: string;
    picId?: string;
    picName?: string;
    price?: number;
    endTime?: number;
    recipient?: string;
  };
}

export interface IRequestPayload extends IRequestPayloadWithoutSender {
  sender: string;
}

export type IResponsePayloadWithoutSender = IRequestPayloadWithoutSender;

export interface IResponsePayload extends IResponsePayloadWithoutSender {
  sender: string;
}
