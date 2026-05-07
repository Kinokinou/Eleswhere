export type ChatPanelKey = "chat" | "invite" | "saved";

export type ChatPanelConfig = {
  key: ChatPanelKey;
  tabLabel: string;
  panelTitle: string;
};

const configs: Record<ChatPanelKey, ChatPanelConfig> = {
  chat: {
    key: "chat",
    tabLabel: "Chat",
    panelTitle: "聊天记录",
  },
  invite: {
    key: "invite",
    tabLabel: "Invite",
    panelTitle: "当前导航",
  },
  saved: {
    key: "saved",
    tabLabel: "Saved",
    panelTitle: "已保存灵感",
  },
};

export const chatPanelTabs = Object.values(configs);

export function getChatPanelConfig(key: ChatPanelKey) {
  return configs[key];
}
