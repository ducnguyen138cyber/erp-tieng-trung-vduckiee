import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const read = (p) => fs.readFileSync(p, "utf8");
const home = "https://vduckie.pages.dev/";

test("the public entry and JS shell have matching search metadata", () => {
  for (const file of ["index.html", "app-shell-v88.html"]) {
    const html = read(file);
    assert.match(html, /<title>VDuckie – Tự học tiếng Trung HSK, từ điển và ERP<\/title>/);
    assert.match(html, /<meta name="description" content="[^"]{40,200}">/);
    assert.match(html, /<meta name="robots" content="index,follow,max-image-preview:large">/);
    assert.match(html, /<link rel="canonical" href="https:\/\/vduckie\.pages\.dev\/">/);
    const ld = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    assert.ok(ld, "Missing structured data in " + file);
    const json = JSON.parse(ld[1]);
    assert.equal(json["@type"], "WebSite");
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


test("static learning guides are indexable, linked, and have distinct canonical URLs", () => {
  const sitemap = read("sitemap.xml");
  const entry = read("index.html");
  const pages = [
    ["hoc-tieng-trung-hsk.html", "luyen-go-pinyin.html"],
    ["luyen-go-pinyin.html", "hoc-tieng-trung-hsk.html"],
  ];
  for (const [file, other] of pages) {
    const html = read(file);
    const canonical = home + file;
    assert.ok(sitemap.includes("<loc>" + canonical + "</loc>"), "Sitemap must list " + file);
    assert.ok(entry.includes('href="./' + file + '"'), "Homepage fallback should link to " + file);
    assert.match(html, /<html lang="vi">/);
    assert.ok(html.includes('<link rel="canonical" href="' + canonical + '">'));
    assert.match(html, /<meta name="robots" content="index,follow,max-image-preview:large">/);
    assert.match(html, /<h1>[^<]{25,}<\/h1>/);
    assert.ok(html.includes('href="./' + other + '"'), "Related guide needs crawlable internal link");
    assert.ok(html.includes('href="./?screen='), "Guide should open the real application");
    const ld = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    assert.ok(ld, "Missing WebPage schema: " + file);
    const schema = JSON.parse(ld[1]);
    assert.equal(schema["@type"], "WebPage");
    assert.equal(schema.url, canonical);
    assert.ok(html.replace(/<[^>]*>/g, " ").split(/\s+/).length > 400, file + " is too short to be a useful guide");
  }
  assert.equal([...sitemap.matchAll(/<loc>/g)].length, 3);
  assert.doesNotMatch(sitemap, /\?screen=|\.pages\.dev\/preview/);
});
