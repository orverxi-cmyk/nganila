import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  parseRawTextContacts,
  inferSector,
} from "../src/lib/contacts-parser";

describe("Sector Contact Parser & Organization Utilities", () => {
  test("infers sector accurately based on organizational keywords", () => {
    assert.equal(inferSector("Kigali Serena Hotel"), "hotel");
    assert.equal(inferSector("Akagera Game Lodge"), "hotel");
    assert.equal(inferSector("King Faisal Hospital"), "health");
    assert.equal(inferSector("Polyclinique de l'Etoile"), "health");
    assert.equal(inferSector("University of Rwanda Huye Campus"), "campus");
    assert.equal(inferSector("Kigali Independent University"), "campus");
    assert.equal(inferSector("Green Hills Academy"), "schools");
    assert.equal(inferSector("Lycee de Kigali"), "schools");
    assert.equal(inferSector("Ministry of Environment", "general"), "general");
  });

  test("parses pasted text in various formats and deduplicates identical emails", () => {
    const raw = `
      manager@kigalihotel.rw
      Dr. John Doe <john@faisalhospital.rw>
      info@ur.ac.rw, bursar@greenhillsacademy.rw;
      MANAGER@kigalihotel.rw
      Invalid entry here without email
    `;

    const { contacts, duplicatesSkipped } = parseRawTextContacts(raw, "general");

    assert.equal(contacts.length, 4);
    assert.equal(duplicatesSkipped, 1); // 1 duplicate manager@kigalihotel.rw skipped

    const hotelContact = contacts.find((c) => c.email === "manager@kigalihotel.rw");
    assert.ok(hotelContact);
    assert.equal(hotelContact?.sector, "hotel");

    const doctorContact = contacts.find((c) => c.email === "john@faisalhospital.rw");
    assert.ok(doctorContact);
    assert.equal(doctorContact?.name, "Dr. John Doe");
    assert.equal(doctorContact?.sector, "health");

    const schoolContact = contacts.find((c) => c.email === "bursar@greenhillsacademy.rw");
    assert.ok(schoolContact);
    assert.equal(schoolContact?.sector, "schools");
  });
});
