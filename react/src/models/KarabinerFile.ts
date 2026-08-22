import type { KarabinerFileObject } from "../types";

export class KarabinerFile {
  readonly object: KarabinerFileObject;
  readonly id: string;
  readonly sourceUrl: string;
  readonly rulesetJsonUrl: string | undefined;
  readonly shareUrl: string;
  readonly isJavaScript: boolean;

  constructor(object: KarabinerFileObject) {
    this.object = object;

    let id = object.path.substring(object.path.lastIndexOf("/") + 1);
    if (id.lastIndexOf(".") !== -1) {
      id = id.substring(0, id.lastIndexOf("."));
    }
    this.id = id;
    this.sourceUrl = object.path;
    this.rulesetJsonUrl = object.ruleset_json_path;
    this.isJavaScript = object.path.endsWith(".js");
    this.shareUrl = `?rule=${encodeURIComponent(object.path)}`;
  }
}
