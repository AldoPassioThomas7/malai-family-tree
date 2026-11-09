const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "..", "family.js"), "utf8");
const context = {
    document: { getElementById: () => ({ addEventListener() {} }) },
    window: { matchMedia: () => ({ matches: true }) },
    console
};
vm.runInNewContext(source.replace("    load();",
    "    globalThis.schema = { validateFamily, formatRecord, searchNames };"), context);
const { validateFamily, formatRecord, searchNames } = context.schema;
const person = (Id = "example-1") => ({
    Id, Name: "Example", Aliases: [], Gender: null,
    Birth: { Date: null, IsApproximate: null, Place: null },
    Death: { Date: null, IsApproximate: null, Place: null },
    Spouse: null, Burial: { CemeteryName: null, Location: null, GraveFound: null },
    Notes: null, Sources: []
});

test("repository data validates, including globally unique spouse IDs", () => {
    validateFamily(JSON.parse(fs.readFileSync(path.join(__dirname, "..", "family.json"), "utf8")));
});

test("null details are hidden; spouse facts and aliases remain distinct", () => {
    const record = person();
    assert.equal(formatRecord(record).details.length, 0);
    record.Aliases = ["Alternate"];
    record.Spouse = { ...person("example-2"), Name: "Spouse", Aliases: ["Spouse alias"], Gender: "Female" };
    record.Birth = { Date: "1864", IsApproximate: true, Place: "Example village" };
    record.Burial.GraveFound = false;
    record.Sources = ["Example register"];
    validateFamily(record);
    const details = Array.from(formatRecord(record).details);
    assert(details.includes("பிறந்த ஆண்டு: 1864 (சுமார்)"));
    assert(details.includes("கல்லறை கண்டறியப்பட்டது: இல்லை"));
    assert(details.includes("வாழ்க்கைத் துணை: Spouse"));
    assert(details.includes("வாழ்க்கைத் துணை · பாலினம்: பெண்"));
    assert.deepEqual(Array.from(searchNames(record)), ["Example", "Alternate", "Spouse", "Spouse alias"]);
    record.Burial.GraveFound = true;
    assert(Array.from(formatRecord(record).details).includes("கல்லறை கண்டறியப்பட்டது: ஆம்"));
});

test("invalid or missing nested fields, IDs, and calendar dates are rejected", () => {
    const changes = [
        p => { p.Id = "bad id"; },
        p => { p.Spouse = person(p.Id); },
        p => { p.children = [person(p.Id)]; },
        p => { p.Spouse = { ...person("other"), children: [] }; },
        p => { p.Aliases = [""]; },
        p => { p.Sources = "register"; },
        p => { p.Birth.Date = "1900-02-29"; },
        p => { p.Death.Date = "2024-04-31"; },
        p => { p.Birth.IsApproximate = true; },
        p => { delete p.Burial.Location; },
        p => { p.Burial.GraveFound = "false"; },
        p => { p.Gender = "male"; }
    ];
    for (const change of changes) {
        const record = person();
        change(record);
        assert.throws(() => validateFamily(record));
    }
    for (const key of Object.keys(person())) {
        const record = person();
        delete record[key];
        assert.throws(() => validateFamily(record));
    }
    const record = person();
    record.Birth.Date = "2000-02-29";
    record.Death.Date = "2024";
    validateFamily(record);
});
