import { KarabinerJsonFileObject } from "../types";

export class KarabinerJsonFile {
  readonly object: KarabinerJsonFileObject;
  readonly id: string = "";
  readonly jsonUrl: string = "";
  readonly anchorUrl: string = "";

  constructor(object: KarabinerJsonFileObject) {
    this.object = object;

    const path = object.path;
    if (path !== undefined) {
      let id = path.substring(path.lastIndexOf("/") + 1);
      if (id.lastIndexOf(".") !== -1) {
        id = id.substring(0, id.lastIndexOf("."));
      }
      this.id = id;

      this.jsonUrl = object.path ?? "";
      this.anchorUrl = `#${id}`;
    }
  }
}
