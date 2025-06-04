// types/slate.d.ts
import { BaseEditor } from "slate";
import { ReactEditor } from "slate-react";

type CustomText = {
  text: string;
};

type CustomElement = {
  type: "paragraph";
  children: CustomText[];
};

declare module "slate" {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor;
    Element: CustomElement;
    Text: CustomText;
  }
}
