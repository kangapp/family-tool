const RESIDENTS = [
  { name: "一楼101", previous: "222", current: "225", share: false, managementFeeActive: 10 },
  { name: "一楼102", previous: "656", current: "656", share: false, managementFeeActive: 10 },
  { name: "二楼", previous: "7948", current: "8211", share: true, managementFeeActive: 20 },
  { name: "三楼", previous: "6760", current: "6946", share: true, managementFeeActive: 20 },
  { name: "四楼", previous: "16850", current: "17147", share: true, managementFeeActive: 20 },
  { name: "五楼", previous: "2127", current: "2184", share: true, managementFeeActive: 20 },
  { name: "六楼", previous: "7652", current: "7658", share: true, managementFeeActive: 20 },
  { name: "七楼", previous: "6173", current: "6329", share: true, managementFeeActive: 20 },
  { name: "八楼", previous: "2034", current: "2754", share: true, managementFeeActive: 20 }
];

function createDefaultState() {
  return {
    month: "2026年05月",
    totalBill: "1223.58",
    unitPrice: "0.64",
    rows: RESIDENTS.map((item) => ({
      name: item.name,
      previous: item.previous,
      current: item.current,
      share: item.share,
      managementFee: "",
      managementFeeActive: item.managementFeeActive
    }))
  };
}

module.exports = { RESIDENTS, createDefaultState };
