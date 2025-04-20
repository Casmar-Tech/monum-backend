import {
  IMedia,
  IMediaTranslated,
} from "../../../medias/domain/interfaces/IMedia.js";
import {
  IPlace,
  IPlaceTranslated,
} from "../../../places/domain/interfaces/IPlace.js";

export interface IStop {
  order: number;
  optimizedOrder?: number;
  medias: IMedia[];
  place: IPlace;
}

export interface IStopTranslated {
  order: number;
  optimizedOrder?: number;
  medias: IMediaTranslated[];
  place: IPlaceTranslated;
}
