const { createDefaultState } = require("../../utils/default-data");
const { calculateElectricity } = require("../../utils/calc");

const STORAGE_KEY = "family-electricity-draft";

Page({
  data: {
    form: createDefaultState(),
    result: calculateElectricity(createDefaultState())
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
  }
});
