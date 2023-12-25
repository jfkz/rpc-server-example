import {
  ERequestType,
  IRequestPayload,
  IResponsePayload,
  IResponsePayloadWithoutSender,
  IScenario,
} from '../lib/interfaces';

export const scenarioDefault: IScenario = async (data: IRequestPayload) => undefined;

export const scenario1: IScenario = async (data: IRequestPayload) => undefined;

export const scenario2: IScenario = async (
  payload: IRequestPayload,
  myId?: string,
): Promise<IResponsePayloadWithoutSender> => {
  console.debug(`Scenario 2: ${JSON.stringify(payload)}`);
  switch (payload.type) {
    case ERequestType.auction_start:
      return {
        type: ERequestType.bid,
        data: {
          auctionId: payload.data.auctionId,
          price: 75,
        },
      };
      break;
    case ERequestType.bid_accepted:
      if (payload.data.recipient !== payload.sender && payload.data.price === 75.5) {
        return {
          type: ERequestType.bid,
          data: {
            auctionId: payload.data.auctionId,
            price: 80,
          },
        };
      }
      break;
    case ERequestType.auction_end:
      if (payload.data.recipient === myId) {
        console.debug(`I won auction ${payload.data.auctionId}`);
      }
      break;
  }
};

export const scenario3: IScenario = async (payload: IRequestPayload) => {
  console.debug(`Scenario 3: ${JSON.stringify(payload)}`);
  switch (payload.type) {
    case ERequestType.bid_accepted:
      if (payload.data.recipient !== payload.sender && payload.data.price === 75) {
        return {
          type: ERequestType.bid,
          data: {
            auctionId: payload.data.auctionId,
            price: 75.5,
          },
        };
      }
      break;
  }
};
