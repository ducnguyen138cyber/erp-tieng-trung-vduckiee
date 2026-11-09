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


test("two useful, static Vietnamese guides have canonical metadata and are discoverable", () => {
  const sitemap = read("sitemap.xml");
  const entry = read("index.html");
  const shell = read("app-shell-v88.html");
  const pages = [
    ["hoc-tieng-trung-hsk.html", "luyen-go-pinyin.html"],
    ["luyen-go-pinyin.html", "hoc-tieng-trung-hsk.html"],
  ];
  for (const [path, other] of pages) {
    const source = read(path);
    const canonical = home + path;
    assert.ok(sitemap.includes("<loc>" + canonical + "</loc>"), "Missing sitemap URL: " + path);
    assert.ok(entry.includes('href="./' + path + '"'), "Missing non-JS homepage link: " + path);
    assert.ok(shell.includes('href="./' + path + '"'), "Missing rendered homepage link: " + path);
    assert.match(source, /<html lang="vi">/);
    assert.ok(source.includes('<link rel="canonical" href="' + canonical + '">'));
    assert.match(source, /<meta name="robots" content="index,follow,max-image-preview:large">/);
    assert.match(source, /<h1>[^<]{25,}<\/h1>/);
    assert.ok(source.includes('href="./' + other + '"'));
    assert.match(source, /duckie-reader-icon-192\.png/);
    const ld = source.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    assert.ok(ld, "Missing schema: " + path);
    const json = JSON.parse(ld[1]);
    assert.equal(json["@type"], "WebPage");
    assert.equal(json.url, canonical);
    assert.equal(json.isPartOf.name, "VDuckie");
    assert.ok(source.replace(/<[^>]*>/g, " ").split(/\s+/).length > 400, path + " lacks substantive content");
  }
  assert.equal([...sitemap.matchAll(/<loc>/g)].length, 3);
  assert.doesNotMatch(sitemap, /\?screen=|\.pages\.dev\/preview/);
  assert.match(shell, /<nav class="vd-seo-guides" aria-label="Cẩm nang học tiếng Trung">/);
  assert.match(shell, /href="\.\/assets\/seo\/home-guides\.css\?v=1"/);
});
