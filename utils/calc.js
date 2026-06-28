function toNumber(value) {
  if (value === "" || value === null || value === undefined) return 0;
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function calculateElectricity(state) {
  const errors = [];
  const unitPrice = toNumber(state.unitPrice);
  const totalBill = toNumber(state.totalBill);

  if (unitPrice < 0) errors.push("电费每度不能小于 0");
  if (totalBill < 0) errors.push("总表电费不能小于 0");

  const baseRows = state.rows.map((row) => {
    const previous = toNumber(row.previous);
    const current = toNumber(row.current);
    const usage = current - previous;

    if (usage < 0) errors.push(`${row.name} 本月读数不能小于上月底数`);

    const electricityFee = round2(Math.max(usage, 0) * Math.max(unitPrice, 0));
    const defaultManagementFee = usage > 0 ? row.managementFeeActive : 0;
    const managementFee = row.managementFee === "" ? defaultManagementFee : toNumber(row.managementFee);

    return {
      ...row,
      previous,
      current,
      usage: Math.max(usage, 0),
      electricityFee,
      shareFee: 0,
      managementFee,
      total: 0
    };
  });

  const electricityTotal = round2(baseRows.reduce((sum, row) => sum + row.electricityFee, 0));
  const shareRows = baseRows.filter((row) => row.share);
  const remainingShare = round2(Math.max(totalBill, 0) - electricityTotal);
  const shareFee = shareRows.length > 0 ? round2(remainingShare / shareRows.length) : 0;

  if (shareRows.length === 0 && remainingShare !== 0) errors.push("没有参与平摊的住户，无法分摊剩余电费");

  const rows = baseRows.map((row) => {
    const rowShareFee = row.share ? shareFee : 0;
    return {
      ...row,
      shareFee: rowShareFee,
      total: round2(row.electricityFee + rowShareFee + row.managementFee)
    };
  });

  return {
    rows,
    summary: {
      electricityTotal,
      remainingShare,
      shareCount: shareRows.length,
      shareFee,
      grandTotal: round2(rows.reduce((sum, row) => sum + row.total, 0))
    },
    errors
  };
}

module.exports = { calculateElectricity, round2, toNumber };
