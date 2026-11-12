import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const read = (p) => fs.readFileSync(p, "utf8");
const home = "https://vduckie.pages.dev/";

test("the public entry and JS shell have matching search metadata", () => {
  for (const file of ["index.html", "app-shell-v88.html"]) {
    const html = read(file);
    assert.match(html, /<title>VDuckie – Tự học tiếng Trung HSK miễn phí<\/title>/);
    assert.match(html, /<meta name="description" content="[^"]{40,200}">/);
    assert.match(html, /<meta name="robots" content="index,follow,max-image-preview:large">/);
    assert.match(html, /<link rel="canonical" href="https:\/\/vduckie\.pages\.dev\/">/);
    const ld = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    assert.ok(ld, "Missing structured data in " + file);
    const json = JSON.parse(ld[1]);
    assert.equal(json["@type"], "WebSite");
    assert.equal(json.name, "VDuckie");
    assert.ok(json.alternateName.includes("VDuckie Chinese"));
    assert.match(html, /<meta property="og:site_name" content="VDuckie">/);
    assert.match(html, /<link rel="icon" type="image\/png"[^>]+duckie-reader-icon-192\.png/);
    assert.equal(json.url, home);
    const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)];
    for (const [, attrs, code] of scripts) {
      if (/\btype=["']application\/ld\+json["']/i.test(attrs)) continue;
      assert.doesNotThrow(() => new vm.Script(code), file + " contains invalid JavaScript");
    }
  }
});

test("crawler rules and sitemap expose the canonical VDuckie URL", () => {
  assert.match(read("robots.txt"), /User-agent: \*\nAllow: \//);
  assert.match(read("robots.txt"), /Sitemap: https:\/\/vduckie\.pages\.dev\/sitemap\.xml/);
  assert.match(read("sitemap.xml"), /<loc>https:\/\/vduckie\.pages\.dev\/<\/loc>/);
  assert.doesNotMatch(read("sitemap.xml"), /[a-z0-9]{8}\.vduckie\.pages\.dev/);
});


test("static study guides are discoverable and have distinct canonical metadata", () => {
  const sitemap = read("sitemap.xml");
  const pages = ["hoc-tieng-trung-hsk", "luyen-go-pinyin", "luyen-nghe-shadowing"];
  const titles = new Set();
  for (const slug of pages) {
    const source = read(slug + "/index.html"), canonical = home + slug + "/";
    for (const entry of ["index.html", "app-shell-v88.html"]) {
      assert.ok(read(entry).includes('href="./' + slug + '/"'), "Missing discovery link in " + entry);
    }
    assert.ok(sitemap.includes("<loc>" + canonical + "</loc>"));
    assert.ok(source.includes('<link rel="canonical" href="' + canonical + '">'));
    assert.match(source, /<html lang="vi">/);
    assert.match(source, /<h1>[^<]{25,}<\/h1>/);
    assert.doesNotMatch(source, /<script[^>]+src=/, "guide content must not depend on app scripts");
    const title = source.match(/<title>(.*?)<\/title>/)[1];
    assert.equal(titles.has(title), false, "duplicate page title"); titles.add(title);
    const ld = JSON.parse(source.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
    assert.equal(ld.url, canonical); assert.equal(ld.name, title); assert.equal(ld["@type"], "WebPage");
    for (const [, href] of source.matchAll(/href="([^"#]+)"/g)) {
      const url = new URL(href.replaceAll("&amp;", "&"), canonical);
      if (url.origin !== new URL(home).origin) continue;
      const file = url.pathname.endsWith("/") ? url.pathname + "index.html" : url.pathname;
      assert.ok(fs.existsSync("." + file), "broken public guide link: " + href);
    }
  }
  assert.equal([...sitemap.matchAll(/<loc>/g)].length, 4);
  assert.doesNotMatch(sitemap, /\?screen=|\.html<|[a-z0-9]{8}\.vduckie\.pages\.dev/);
});

test("a failed app shell keeps the static introduction and reports failure after DOM ready", async () => {
  const source = read("index.html");
  const bootstrap = [...source.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)].find(([, , code]) => code.includes("restoreStaticVDuckie"))[2];
  for (const readyState of ["loading", "complete"]) {
    const status = {textContent: "Đang mở VDuckie…"}, events = [];
    const document = {readyState, getElementById: id => id === "vduckieBootStatus" ? status : null, addEventListener: (name, callback) => events.push({name, callback})};
    await vm.runInNewContext(bootstrap, {document, fetch: async () => {throw new Error("offline")}, console: {error() {}}});
    if (readyState === "loading") {assert.equal(events[0].name, "DOMContentLoaded"); events[0].callback();}
    assert.match(status.textContent, /vẫn có thể đọc/);
  }
});
