const { createDefaultState } = require("../../utils/default-data");
const { calculateElectricity } = require("../../utils/calc");

const STORAGE_KEY = "family-electricity-draft";
const TEMPLATE_KEY = "family-electricity-template";

function getTemplateState() {
  return wx.getStorageSync(STORAGE_KEY) || wx.getStorageSync(TEMPLATE_KEY) || createDefaultState();
}

Page({
  data: {
    form: getTemplateState(),
    result: calculateElectricity(getTemplateState())
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

  done() {
    wx.navigateBack();
  }
});
