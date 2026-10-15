import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  slugifyGroupName,
  generateUniqueGroupId,
  chunkArray,
  DEFAULT_CONTACT_GROUPS,
  ContactGroup,
} from "../src/lib/contact-groups";

describe("Contact Groups & Purge Batch Utilities", () => {
  test("slugifies group names cleanly", () => {
    assert.equal(slugifyGroupName("Commercial Banks & Finance"), "commercial_banks_finance");
    assert.equal(slugifyGroupName("NGOs, Churches & Embassies!"), "ngos_churches_embassies");
    assert.equal(slugifyGroupName("   Special Group   "), "special_group");
    assert.match(slugifyGroupName("---"), /^group_\d+$/);
  });

  test("generates unique group IDs without collisions", () => {
    const existing: ContactGroup[] = [
      { id: "hotel", name: "Hotels & Hospitality" },
      { id: "banks", name: "Banks" },
      { id: "banks_1", name: "Banks Duplicate" },
    ];

    assert.equal(generateUniqueGroupId("Schools", existing), "schools");
    assert.equal(generateUniqueGroupId("Hotel", existing), "hotel_1");
    assert.equal(generateUniqueGroupId("Banks", existing), "banks_2");
  });

  test("chunks arrays accurately for Firestore batch operations (max 400)", () => {
    const ids = Array.from({ length: 950 }, (_, i) => `contact_${i}`);
    const chunks = chunkArray(ids, 400);

    assert.equal(chunks.length, 3);
    assert.equal(chunks[0].length, 400);
    assert.equal(chunks[1].length, 400);
    assert.equal(chunks[2].length, 150);

    // Verify all IDs preserved without loss
    const flattened = chunks.flat();
    assert.equal(flattened.length, 950);
    assert.equal(flattened[0], "contact_0");
    assert.equal(flattened[949], "contact_949");
  });

  test("contains standard built-in fallback groups", () => {
    assert.ok(DEFAULT_CONTACT_GROUPS.length >= 6);
    const ids = DEFAULT_CONTACT_GROUPS.map((g) => g.id);
    assert.ok(ids.includes("hotel"));
    assert.ok(ids.includes("health"));
    assert.ok(ids.includes("campus"));
    assert.ok(ids.includes("schools"));
    assert.ok(ids.includes("general"));
    assert.ok(ids.includes("other"));
  });
});
