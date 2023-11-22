import IMedia from "../../medias/domain/IMedia.js";

export default interface IStop {
  order: number;
  optimizedOrder: number;
  media: IMedia;
}
