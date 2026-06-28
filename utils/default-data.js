const RESIDENTS = [
  { name: "一楼101", share: false, managementFeeActive: 10 },
  { name: "一楼102", share: false, managementFeeActive: 10 },
  { name: "二楼", share: true, managementFeeActive: 20 },
  { name: "三楼", share: true, managementFeeActive: 20 },
  { name: "四楼", share: true, managementFeeActive: 20 },
  { name: "五楼", share: true, managementFeeActive: 20 },
  { name: "六楼", share: true, managementFeeActive: 20 },
  { name: "七楼", share: true, managementFeeActive: 20 },
  { name: "八楼", share: true, managementFeeActive: 20 }
];

function createDefaultState() {
  return {
    month: "2026年05月",
    totalBill: "",
    unitPrice: "0.64",
    rows: RESIDENTS.map((item) => ({
      name: item.name,
      previous: "",
      current: "",
      share: item.share,
      managementFee: "",
      managementFeeActive: item.managementFeeActive
    }))
  };
}

module.exports = { RESIDENTS, createDefaultState };
