import { describe, expect, it } from "vitest";
import {
  appendJscode,
  buildAmapRegeoUrl,
  normalizeAmapRegeo,
  validateRegeoPoint,
} from "./amap";

describe("validateRegeoPoint", () => {
  it("拒绝非法经纬度", () => {
    expect(validateRegeoPoint({ id: "bad", lat: 91, lng: 120 })).toBe(false);
    expect(validateRegeoPoint({ id: "bad", lat: 20, lng: 181 })).toBe(false);
    expect(validateRegeoPoint({ id: "ok", lat: 22.1, lng: 113.5 })).toBe(true);
  });
});

describe("normalizeAmapRegeo", () => {
  it("按 aoi、poi、行政区、详细地址生成地点名称", () => {
    const result = normalizeAmapRegeo("p1", 22.1, 113.5, {
      status: "1",
      info: "OK",
      regeocode: {
        formatted_address: "广东省珠海市香洲区富祥湾",
        addressComponent: {
          country: "中国",
          province: "广东省",
          city: "珠海市",
          district: "香洲区",
          township: "横琴镇",
          adcode: "440402",
        },
        pois: [{ name: "珠海长隆海洋王国" }],
        aois: [{ name: "横琴长隆国际海洋度假区" }],
      },
    });

    expect(result).toMatchObject({
      id: "p1",
      formattedAddress: "广东省珠海市香洲区富祥湾",
      poiName: "珠海长隆海洋王国",
      aoiName: "横琴长隆国际海洋度假区",
      placeName: "横琴长隆国际海洋度假区",
      status: "success",
    });
  });
});

describe("buildAmapRegeoUrl", () => {
  it("使用后端 Web 服务 Key 拼接逆地理编码 URL", () => {
    const url = buildAmapRegeoUrl({ lat: 22.104981, lng: 113.540123 }, "web-key");

    expect(url).toContain("https://restapi.amap.com/v3/geocode/regeo?");
    expect(url).toContain("key=web-key");
    expect(url).toContain("location=113.540123%2C22.104981");
    expect(url).toContain("extensions=all");
  });
});

describe("appendJscode", () => {
  it("给高德代理请求追加安全密钥", () => {
    const url = appendJscode(
      "https://restapi.amap.com/v3/place/text?keywords=cafe",
      "security-code",
    );

    expect(url).toBe(
      "https://restapi.amap.com/v3/place/text?keywords=cafe&jscode=security-code",
    );
  });
});
