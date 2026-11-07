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
