"use client";

import {
  Heart,
  MailPlus,
  Map,
  MapPin,
  MessageCircle,
  PanelLeft,
  PanelRight,
  Send,
  Sparkles,
  Users,
} from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import {
  chatPanelTabs,
  getChatPanelConfig,
  type ChatPanelKey,
} from "@/lib/chat-panels";

const itinerary = [
  {
    title: "导入照片",
    time: "第 1 步",
    detail: "选择旅行照片，读取拍摄时间和 GPS。",
  },
  {
    title: "识别地点",
    time: "第 2 步",
    detail: "后端调用高德逆地理编码，生成地点名称。",
  },
  {
    title: "生成路线",
    time: "第 3 步",
    detail: "按天和地点整理为旅行时间线。",
  },
  {
    title: "确认旅行",
    time: "第 4 步",
    detail: "编辑标题、封面和每日标题后保存。",
  },
];

const navigationItems = ["Dashboard", "Map", "Trips", "Chat", "Yearly Report"];

export default function ChatPage() {
  const [activePanel, setActivePanel] = useState<ChatPanelKey>("chat");
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const activeConfig = getChatPanelConfig(activePanel);

  return (
    <section>
      <PageHeader
        title="Chat"
        description="参考你提供的 Mindtrip 工作台风格：左侧对话，右侧根据 Chat / Invite / Saved 切换伸缩框。"
      />

      <div
        className={`grid min-h-[720px] gap-5 transition-[grid-template-columns] ${
          rightPanelOpen
            ? "xl:grid-cols-[1fr_430px]"
            : "xl:grid-cols-[1fr_72px]"
        }`}
      >
        <div className="flex rounded-lg border border-black/10 bg-white">
          <div className="flex flex-1 flex-col p-6">
            <div className="flex flex-col gap-5 border-b border-black/10 pb-4 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="text-sm font-semibold text-black/45">New chat</div>
                <h2 className="mt-1 text-3xl font-semibold tracking-[0px]">
                  今天想整理哪段旅途？
                </h2>
              </div>
              <SegmentedControl
                activePanel={activePanel}
                onChange={(panel) => {
                  setActivePanel(panel);
                  setRightPanelOpen(true);
                }}
              />
            </div>

            <div className="flex flex-1 flex-col justify-between">
              <div className="max-w-3xl pt-12">
                <div className="flex gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-black text-white">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <p className="text-xl font-semibold">
                      我可以帮你把照片整理成旅行草稿。
                    </p>
                    <p className="mt-3 max-w-xl text-sm leading-6 text-black/55">
                      你可以询问“这批照片会生成几天行程？”、“哪些地点识别失败？”或者“帮我把标题改得更像旅行手账”。
                    </p>
                  </div>
                </div>

                <div className="mt-10 space-y-4">
                  <ChatBubble
                    role="user"
                    text="我导入珠海长隆的照片后，系统会怎么整理？"
                  />
                  <ChatBubble
                    role="assistant"
                    text="系统会先读取拍摄时间，再用 GPS 调用后端逆地理编码，把照片分成每日时间线、地点段落和路线点。"
                  />
                </div>
              </div>

              <div className="mt-10 rounded-lg border border-black/10 bg-[#f7f7f5] p-3">
                <div className="flex items-center gap-3">
                  <button className="flex h-10 w-10 items-center justify-center rounded-lg bg-white">
                    <Sparkles size={18} />
                  </button>
                  <input
                    className="h-10 flex-1 bg-transparent text-sm outline-none"
                    placeholder="询问 Eleswhere 如何整理你的旅行..."
                  />
                  <button className="flex h-10 w-10 items-center justify-center rounded-lg bg-black text-white">
                    <Send size={17} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <aside className="overflow-hidden rounded-lg border border-black/10 bg-white">
          {rightPanelOpen ? (
            <div className="p-6">
              <div className="flex items-center justify-between">
                <button
                  className="flex h-11 w-11 items-center justify-center rounded-lg border border-black/10 hover:bg-black/[0.04]"
                  onClick={() => setRightPanelOpen(false)}
                  aria-label="收起右侧面板"
                  type="button"
                >
                  <PanelRight size={18} />
                </button>
                <div className="flex gap-2 text-xs font-semibold text-black/55">
                  <span className="rounded-full border border-black/10 px-3 py-2">
                    {activeConfig.tabLabel}
                  </span>
                  <span className="rounded-full border border-black/10 px-3 py-2">
                    右侧面板
                  </span>
                </div>
              </div>

              <h3 className="mt-8 text-4xl font-semibold leading-tight tracking-[0px]">
                {activeConfig.panelTitle}
              </h3>

              <PanelContent activePanel={activePanel} />
            </div>
          ) : (
            <button
              className="flex h-full min-h-[720px] w-full flex-col items-center gap-3 px-3 py-6 text-black/55 hover:bg-black/[0.03]"
              onClick={() => setRightPanelOpen(true)}
              aria-label="展开右侧面板"
              type="button"
            >
              <PanelLeft size={20} />
              <span className="[writing-mode:vertical-rl] text-xs font-semibold">
                {activeConfig.tabLabel}
              </span>
            </button>
          )}
        </aside>
      </div>
    </section>
  );
}

function SegmentedControl({
  activePanel,
  onChange,
}: {
  activePanel: ChatPanelKey;
  onChange: (panel: ChatPanelKey) => void;
}) {
  return (
    <div className="flex rounded-full border border-black/10 bg-white p-1 text-sm shadow-sm">
      {chatPanelTabs.map((tab) => {
        const active = activePanel === tab.key;
        const Icon =
          tab.key === "chat" ? MessageCircle : tab.key === "invite" ? MailPlus : Heart;

        return (
          <button
            key={tab.key}
            className={`inline-flex h-10 items-center gap-2 rounded-full px-4 font-medium transition ${
              active ? "bg-black text-white" : "text-black/55 hover:bg-black/[0.04]"
            }`}
            type="button"
            onClick={() => onChange(tab.key)}
          >
            <Icon size={16} />
            {tab.tabLabel}
          </button>
        );
      })}
    </div>
  );
}

function PanelContent({ activePanel }: { activePanel: ChatPanelKey }) {
  if (activePanel === "chat") {
    return <ChatHistoryPanel />;
  }

  if (activePanel === "invite") {
    return <InvitePanel />;
  }

  return <SavedPanel />;
}

function ChatHistoryPanel() {
  return (
    <div className="mt-6 space-y-3">
      {[
        "新建旅行流程讨论",
        "高德逆地理编码配置",
        "照片导入后如何分组",
      ].map((item, index) => (
        <button
          key={item}
          className="w-full rounded-lg border border-black/10 p-4 text-left hover:bg-black/[0.03]"
          type="button"
        >
          <div className="flex items-center justify-between">
            <span className="font-semibold">{item}</span>
            <span className="text-xs text-black/40">#{index + 1}</span>
          </div>
          <p className="mt-2 text-sm leading-5 text-black/55">
            查看这次对话里的需求、决策和后续任务。
          </p>
        </button>
      ))}
    </div>
  );
}

function InvitePanel() {
  return (
    <div className="mt-6 space-y-5">
      <div className="rounded-lg bg-[#d8f35f] p-5">
        <div className="flex items-center gap-2 font-semibold">
          <Users size={18} />
          邀请协作者
        </div>
        <p className="mt-3 text-sm leading-6 text-black/65">
          当前是本地 MVP，占位展示邀请入口；后续可接入登录和共享旅行草稿。
        </p>
      </div>

      <div>
        <div className="text-sm font-semibold text-black/55">当前导航</div>
        <div className="mt-3 space-y-2">
          {navigationItems.map((item) => (
            <div
              key={item}
              className="flex items-center justify-between rounded-lg border border-black/10 px-4 py-3 text-sm"
            >
              <span>{item}</span>
              <span className={item === "Chat" ? "font-semibold text-black" : "text-black/35"}>
                {item === "Chat" ? "当前" : "可访问"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SavedPanel() {
  return (
    <div className="mt-6 space-y-6">
      <div>
        <div className="text-sm font-semibold text-black/55">For you in Eleswhere</div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {["城市记忆卡", "旅行路线", "照片墙", "年度报告"].map((item) => (
            <div
              key={item}
              className="min-h-28 rounded-lg bg-[#eef1ec] p-4 text-sm font-semibold"
            >
              {item}
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="text-sm font-semibold text-black/55">Get started</div>
        <div className="mt-3 space-y-3">
          {itinerary.map((item, index) => (
            <div key={item.title}>
              <div className="rounded-lg border border-black/10 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#eef1ec]">
                    {index === 2 ? <Map size={18} /> : <MapPin size={18} />}
                  </div>
                  <div>
                    <div className="font-semibold">{item.title}</div>
                    <div className="mt-1 text-xs text-black/45">{item.time}</div>
                    <p className="mt-2 text-sm leading-5 text-black/55">{item.detail}</p>
                  </div>
                </div>
              </div>
              {index < itinerary.length - 1 ? (
                <div className="ml-6 h-4 border-l border-dashed border-black/20" />
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ChatBubble({ role, text }: { role: "user" | "assistant"; text: string }) {
  return (
    <div className={`flex ${role === "user" ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-xl rounded-lg px-4 py-3 text-sm leading-6 ${
          role === "user" ? "bg-black text-white" : "bg-[#f7f7f5] text-black/70"
        }`}
      >
        {text}
      </div>
    </div>
  );
}
