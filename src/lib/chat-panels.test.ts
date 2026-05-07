import { describe, expect, it } from "vitest";
import { getChatPanelConfig } from "./chat-panels";

describe("getChatPanelConfig", () => {
  it("把 Chat / Invite / Saved 映射到对应右侧伸缩框内容", () => {
    expect(getChatPanelConfig("chat")).toMatchObject({
      tabLabel: "Chat",
      panelTitle: "聊天记录",
    });
    expect(getChatPanelConfig("invite")).toMatchObject({
      tabLabel: "Invite",
      panelTitle: "当前导航",
    });
    expect(getChatPanelConfig("saved")).toMatchObject({
      tabLabel: "Saved",
      panelTitle: "已保存灵感",
    });
  });
});
