const assert = require("assert");
const { createDefaultState } = require("./default-data");
const { calculateElectricity } = require("./calc");

const state = createDefaultState();
state.totalBill = "1223.58";
state.unitPrice = "0.64";
state.rows[0].previous = "222";
state.rows[0].current = "225";
state.rows[1].previous = "656";
state.rows[1].current = "656";
state.rows[2].previous = "7948";
state.rows[2].current = "8211";

const result = calculateElectricity(state);

assert.equal(result.rows[0].usage, 3);
assert.equal(result.rows[0].electricityFee, 1.92);
assert.equal(result.rows[0].managementFee, 10);
assert.equal(result.rows[1].managementFee, 0);
assert.equal(result.summary.shareCount, 7);
assert.equal(result.errors.length, 0);

const invalid = createDefaultState();
invalid.rows[0].previous = "10";
invalid.rows[0].current = "9";
const invalidResult = calculateElectricity(invalid);
assert.equal(invalidResult.errors[0], "一楼101 本月读数不能小于上月底数");
assert.equal(invalidResult.rows[0].errors.current, true);

const invalidBase = createDefaultState();
invalidBase.totalBill = "-1";
invalidBase.unitPrice = "-1";
const invalidBaseResult = calculateElectricity(invalidBase);
assert.equal(invalidBaseResult.fieldErrors.totalBill, true);
assert.equal(invalidBaseResult.fieldErrors.unitPrice, true);

console.log("calc self-check passed");
