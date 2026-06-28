const { createDefaultState } = require("../../utils/default-data");
const { calculateElectricity } = require("../../utils/calc");

const STORAGE_KEY = "family-electricity-draft";

Page({
  data: {
    form: createDefaultState(),
    result: calculateElectricity(createDefaultState()),
    imagePath: ""
  },

  onLoad() {
    const saved = wx.getStorageSync(STORAGE_KEY);
    if (saved) {
      this.setForm(saved);
    }
  },

  setForm(form) {
    const result = calculateElectricity(form);
    this.setData({ form, result });
    wx.setStorageSync(STORAGE_KEY, form);
  },

  updateBase(event) {
    const { field } = event.currentTarget.dataset;
    this.setForm({ ...this.data.form, [field]: event.detail.value });
  },

  updateRow(event) {
    const { index, field } = event.currentTarget.dataset;
    const rowIndexNumber = Number(index);
    const rows = this.data.form.rows.map((row, rowIndex) => {
      if (rowIndex !== rowIndexNumber) return row;
      return { ...row, [field]: event.detail.value };
    });
    this.setForm({ ...this.data.form, rows });
  },

  updateShare(event) {
    const { index } = event.currentTarget.dataset;
    const rowIndexNumber = Number(index);
    const rows = this.data.form.rows.map((row, rowIndex) => {
      if (rowIndex !== rowIndexNumber) return row;
      return { ...row, share: event.detail.value };
    });
    this.setForm({ ...this.data.form, rows });
  },

  resetForm() {
    wx.removeStorageSync(STORAGE_KEY);
    this.setForm(createDefaultState());
  },

  generateImage() {
    if (this.data.result.errors.length > 0) {
      wx.showToast({ title: "请先修正错误", icon: "none" });
      return;
    }

    const ctx = wx.createCanvasContext("billCanvas", this);
    const width = 1080;
    const left = 50;
    const top = 120;
    const rowHeight = 72;
    const columns = [140, 110, 110, 110, 105, 105, 105, 105, 85];
    const headers = ["楼层住户", "上月底数", "本月读数", "用电量", "电费", "分摊费", "管理费", "合计", "平摊"];

    ctx.setFillStyle("#fffdf8");
    ctx.fillRect(0, 0, width, 1500);
    ctx.setFillStyle("#1f2933");
    ctx.setFontSize(44);
    ctx.setTextAlign("center");
    ctx.fillText(`${this.data.form.month}电费明细表`, width / 2, 70);

    let y = top;
    this.drawTableRow(ctx, left, y, columns, headers, rowHeight, true);
    y += rowHeight;

    this.data.result.rows.forEach((row) => {
      this.drawTableRow(ctx, left, y, columns, [
        row.name,
        row.previous,
        row.current,
        row.usage,
        row.electricityFee,
        row.shareFee,
        row.managementFee,
        row.total,
        row.share ? "是" : "否"
      ], rowHeight, false);
      y += rowHeight;
    });

    ctx.setTextAlign("left");
    ctx.setFontSize(30);
    ctx.fillText(`总表电费：${this.data.form.totalBill || 0} 元`, left, y + 70);
    ctx.fillText(`电费每度：${this.data.form.unitPrice || 0} 元`, left, y + 118);
    ctx.fillText(`合计：${this.data.result.summary.grandTotal} 元`, left, y + 166);

    ctx.draw(false, () => {
      wx.canvasToTempFilePath({
        canvasId: "billCanvas",
        width,
        height: 1500,
        destWidth: width,
        destHeight: 1500,
        success: (res) => this.setData({ imagePath: res.tempFilePath }),
        fail: () => wx.showToast({ title: "生成失败", icon: "none" })
      }, this);
    });
  },

  drawTableRow(ctx, left, top, columns, values, height, isHeader) {
    let x = left;
    ctx.setStrokeStyle("#4b5563");
    ctx.setFillStyle(isHeader ? "#efe8dc" : "#fffdf8");
    ctx.setFontSize(24);
    ctx.setTextAlign("center");

    columns.forEach((width, index) => {
      ctx.fillRect(x, top, width, height);
      ctx.strokeRect(x, top, width, height);
      ctx.setFillStyle("#1f2933");
      ctx.fillText(String(values[index] == null ? "" : values[index]), x + width / 2, top + 45);
      ctx.setFillStyle(isHeader ? "#efe8dc" : "#fffdf8");
      x += width;
    });
  },

  saveImage() {
    if (!this.data.imagePath) return;
    wx.saveImageToPhotosAlbum({
      filePath: this.data.imagePath,
      success: () => wx.showToast({ title: "已保存" }),
      fail: () => wx.showToast({ title: "保存失败", icon: "none" })
    });
  }
});
