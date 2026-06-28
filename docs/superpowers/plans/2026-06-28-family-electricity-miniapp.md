# Family Electricity Miniapp Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first version of a WeChat Mini Program for editing household electricity readings, calculating shared fees, and generating a shareable detail image.

**Architecture:** Use a native WeChat Mini Program with one page. Keep calculation logic in a plain JavaScript utility so it can be tested with Node before wiring it into the page. Use local storage for draft persistence and Canvas for image generation.

**Tech Stack:** WeChat Mini Program native files, JavaScript, WXSS, Node.js for utility self-checks.

## Global Constraints

- 第一版不做上传 Excel、照片 OCR、登录、多家庭、云同步。
- Excel 文件只作为内置模板和公式参考。
- 住户固定为：一楼101、一楼102、二楼、三楼、四楼、五楼、六楼、七楼、八楼。
- 金额显示保留 2 位小数。用电量显示整数。
- 本月读数不能小于上月底数。
- 参与平摊户数为 0 时，分摊费显示 0，并提示无法分摊。
- 不新增后端服务。

---

## File Structure

- Create: `project.config.json` - WeChat Developer Tools project config.
- Create: `app.json` - Mini Program page and window config.
- Create: `app.js` - App entry.
- Create: `app.wxss` - Global style baseline.
- Create: `pages/index/index.json` - Page config.
- Create: `pages/index/index.wxml` - Editor, preview, and canvas markup.
- Create: `pages/index/index.wxss` - Page styling.
- Create: `pages/index/index.js` - Page state, input handling, storage, and image actions.
- Create: `utils/default-data.js` - Built-in resident rows and default base values.
- Create: `utils/calc.js` - Calculation and validation logic.
- Create: `utils/calc.selfcheck.js` - Small Node self-check for calculation logic.

---

### Task 1: Mini Program Skeleton

**Files:**
- Create: `project.config.json`
- Create: `app.json`
- Create: `app.js`
- Create: `app.wxss`
- Create: `pages/index/index.json`
- Create: `pages/index/index.wxml`
- Create: `pages/index/index.wxss`
- Create: `pages/index/index.js`

**Interfaces:**
- Produces: a runnable one-page Mini Program shell.

- [ ] **Step 1: Create project config**

Create `project.config.json`:

```json
{
  "appid": "touristappid",
  "projectname": "family-tool",
  "setting": {
    "es6": true,
    "minified": true,
    "postcss": true
  },
  "compileType": "miniprogram",
  "miniprogramRoot": "./"
}
```

- [ ] **Step 2: Create app config**

Create `app.json`:

```json
{
  "pages": ["pages/index/index"],
  "window": {
    "navigationBarTitleText": "家庭电费",
    "navigationBarBackgroundColor": "#ffffff",
    "navigationBarTextStyle": "black"
  },
  "style": "v2"
}
```

- [ ] **Step 3: Create app entry and styles**

Create `app.js`:

```js
App({});
```

Create `app.wxss`:

```css
page {
  background: #f6f3ed;
  color: #1f2933;
  font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif;
}
```

- [ ] **Step 4: Create empty page**

Create `pages/index/index.json`:

```json
{
  "navigationBarTitleText": "电费明细"
}
```

Create `pages/index/index.wxml`:

```xml
<view class="page">
  <view class="title">电费明细</view>
</view>
```

Create `pages/index/index.wxss`:

```css
.page {
  padding: 24rpx;
}

.title {
  font-size: 40rpx;
  font-weight: 600;
}
```

Create `pages/index/index.js`:

```js
Page({
  data: {}
});
```

- [ ] **Step 5: Verify skeleton**

Run: open the folder in WeChat Developer Tools.

Expected: the simulator shows a page titled `电费明细`.

- [ ] **Step 6: Commit**

```bash
git add project.config.json app.json app.js app.wxss pages/index
git commit -m "feat: add miniapp skeleton"
```

---

### Task 2: Calculation Logic

**Files:**
- Create: `utils/default-data.js`
- Create: `utils/calc.js`
- Create: `utils/calc.selfcheck.js`

**Interfaces:**
- Produces: `createDefaultState()`
- Produces: `calculateElectricity(state)`
- `calculateElectricity(state)` returns `{ rows, summary, errors }`.

- [ ] **Step 1: Create defaults**

Create `utils/default-data.js`:

```js
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
```

- [ ] **Step 2: Write calculation logic**

Create `utils/calc.js`:

```js
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
```

- [ ] **Step 3: Add self-check**

Create `utils/calc.selfcheck.js`:

```js
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
assert.equal(calculateElectricity(invalid).errors[0], "一楼101 本月读数不能小于上月底数");

console.log("calc self-check passed");
```

- [ ] **Step 4: Run self-check**

Run:

```bash
node utils/calc.selfcheck.js
```

Expected:

```text
calc self-check passed
```

- [ ] **Step 5: Commit**

```bash
git add utils
git commit -m "feat: add electricity calculation"
```

---

### Task 3: Editable Table Page

**Files:**
- Modify: `pages/index/index.js`
- Modify: `pages/index/index.wxml`
- Modify: `pages/index/index.wxss`

**Interfaces:**
- Consumes: `createDefaultState()`
- Consumes: `calculateElectricity(state)`
- Produces: editable Mini Program UI with real-time totals.

- [ ] **Step 1: Wire page state**

Replace `pages/index/index.js`:

```js
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
    const rows = this.data.form.rows.map((row, rowIndex) => {
      if (rowIndex !== index) return row;
      return { ...row, [field]: event.detail.value };
    });
    this.setForm({ ...this.data.form, rows });
  },

  updateShare(event) {
    const { index } = event.currentTarget.dataset;
    const rows = this.data.form.rows.map((row, rowIndex) => {
      if (rowIndex !== index) return row;
      return { ...row, share: event.detail.value };
    });
    this.setForm({ ...this.data.form, rows });
  },

  resetForm() {
    wx.removeStorageSync(STORAGE_KEY);
    this.setForm(createDefaultState());
  }
});
```

- [ ] **Step 2: Build page markup**

Replace `pages/index/index.wxml`:

```xml
<view class="page">
  <view class="header">
    <input class="month" value="{{form.month}}" data-field="month" bindinput="updateBase" />
    <view class="subtitle">电费明细表</view>
  </view>

  <view class="base-grid">
    <label class="field">
      <text>总表电费</text>
      <input type="digit" value="{{form.totalBill}}" data-field="totalBill" bindinput="updateBase" />
    </label>
    <label class="field">
      <text>电费每度</text>
      <input type="digit" value="{{form.unitPrice}}" data-field="unitPrice" bindinput="updateBase" />
    </label>
  </view>

  <scroll-view scroll-x class="table-scroll">
    <view class="table">
      <view class="tr th">
        <text>楼层住户</text>
        <text>上月底数</text>
        <text>本月读数</text>
        <text>用电量</text>
        <text>电费</text>
        <text>平摊</text>
        <text>分摊费</text>
        <text>管理费</text>
        <text>合计</text>
      </view>

      <view class="tr" wx:for="{{result.rows}}" wx:key="name">
        <text>{{item.name}}</text>
        <input type="number" value="{{form.rows[index].previous}}" data-index="{{index}}" data-field="previous" bindinput="updateRow" />
        <input type="number" value="{{form.rows[index].current}}" data-index="{{index}}" data-field="current" bindinput="updateRow" />
        <text>{{item.usage}}</text>
        <text>{{item.electricityFee}}</text>
        <switch checked="{{form.rows[index].share}}" data-index="{{index}}" bindchange="updateShare" />
        <text>{{item.shareFee}}</text>
        <input type="digit" value="{{form.rows[index].managementFee}}" placeholder="{{item.managementFee}}" data-index="{{index}}" data-field="managementFee" bindinput="updateRow" />
        <text>{{item.total}}</text>
      </view>
    </view>
  </scroll-view>

  <view class="errors" wx:if="{{result.errors.length}}">
    <view wx:for="{{result.errors}}" wx:key="*this">{{item}}</view>
  </view>

  <view class="summary">
    <text>参与平摊：{{result.summary.shareCount}} 户</text>
    <text>每户分摊：{{result.summary.shareFee}} 元</text>
    <text>合计：{{result.summary.grandTotal}} 元</text>
  </view>

  <view class="actions">
    <button bindtap="resetForm">重置</button>
  </view>
</view>
```

- [ ] **Step 3: Style the table**

Replace `pages/index/index.wxss`:

```css
.page {
  padding: 24rpx;
}

.header {
  margin-bottom: 24rpx;
  text-align: center;
}

.month {
  display: inline-block;
  width: 260rpx;
  font-size: 36rpx;
  font-weight: 600;
  text-align: center;
}

.subtitle {
  margin-top: 6rpx;
  font-size: 34rpx;
  font-weight: 600;
}

.base-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16rpx;
  margin-bottom: 20rpx;
}

.field {
  display: block;
  padding: 16rpx;
  background: #fff;
  border: 1rpx solid #d8d2c8;
  border-radius: 8rpx;
}

.field text {
  display: block;
  margin-bottom: 8rpx;
  color: #65717c;
  font-size: 24rpx;
}

.table-scroll {
  background: #fffdf8;
  border: 1rpx solid #b9b0a3;
}

.table {
  width: 1440rpx;
}

.tr {
  display: grid;
  grid-template-columns: 160rpx repeat(8, 160rpx);
  min-height: 76rpx;
}

.tr > text,
.tr > input,
.tr > switch {
  box-sizing: border-box;
  min-width: 0;
  padding: 16rpx 10rpx;
  border-right: 1rpx solid #b9b0a3;
  border-bottom: 1rpx solid #b9b0a3;
  text-align: center;
  font-size: 26rpx;
}

.th {
  font-weight: 600;
  background: #efe8dc;
}

.errors {
  margin-top: 18rpx;
  color: #b42318;
  font-size: 24rpx;
}

.summary {
  display: grid;
  gap: 8rpx;
  margin-top: 18rpx;
  font-size: 28rpx;
}

.actions {
  margin-top: 22rpx;
}
```

- [ ] **Step 4: Verify in simulator**

Run: open in WeChat Developer Tools and type sample readings.

Expected:

- Editing numbers updates row totals immediately.
- Negative usage shows an error message.
- The reset button restores default rows.

- [ ] **Step 5: Commit**

```bash
git add pages/index
git commit -m "feat: add editable electricity table"
```

---

### Task 4: Canvas Image Generation

**Files:**
- Modify: `pages/index/index.js`
- Modify: `pages/index/index.wxml`
- Modify: `pages/index/index.wxss`

**Interfaces:**
- Consumes: `result.rows`
- Produces: `generateImage()` and `saveImage()`

- [ ] **Step 1: Add canvas markup**

Add below the actions block in `pages/index/index.wxml`:

```xml
<canvas canvas-id="billCanvas" class="bill-canvas"></canvas>
<image wx:if="{{imagePath}}" class="preview" src="{{imagePath}}" mode="widthFix" />
```

Add buttons inside `.actions`:

```xml
<button type="primary" bindtap="generateImage">生成图片</button>
<button wx:if="{{imagePath}}" bindtap="saveImage">保存图片</button>
```

- [ ] **Step 2: Add canvas styles**

Append to `pages/index/index.wxss`:

```css
.bill-canvas {
  position: fixed;
  left: -9999rpx;
  width: 1080px;
  height: 1500px;
}

.preview {
  display: block;
  width: 100%;
  margin-top: 24rpx;
  border: 1rpx solid #d8d2c8;
}

.actions {
  display: flex;
  gap: 16rpx;
}
```

- [ ] **Step 3: Add drawing methods**

Add to the `Page({ ... })` object in `pages/index/index.js`:

```js
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
    ctx.fillText(String(values[index] ?? ""), x + width / 2, top + 45);
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
```

- [ ] **Step 4: Add initial image data**

Add `imagePath: ""` to the page `data` object.

- [ ] **Step 5: Verify on real device**

Run: use WeChat Developer Tools preview on a phone.

Expected:

- `生成图片` creates a visible preview.
- The image includes title, all 9 rows, totals, and no clipped text.
- `保存图片` saves the image to the phone album after permission approval.

- [ ] **Step 6: Commit**

```bash
git add pages/index
git commit -m "feat: generate electricity bill image"
```

---

### Task 5: Final Verification And Release Prep

**Files:**
- Modify only if verification finds a real issue.

**Interfaces:**
- Consumes: all previous tasks.
- Produces: first working Mini Program version ready for experience build.

- [ ] **Step 1: Run calculation self-check**

Run:

```bash
node utils/calc.selfcheck.js
```

Expected:

```text
calc self-check passed
```

- [ ] **Step 2: Verify Mini Program manually**

Use WeChat Developer Tools and a real phone preview.

Expected:

- Open app shows the edit page.
- Enter total bill and readings.
- Totals update.
- Invalid reading shows error.
- Reset restores defaults.
- Generate image works.
- Save image works.
- Close and reopen keeps draft data.

- [ ] **Step 3: Push all commits**

```bash
git status --short
git push
```

Expected:

```text
Everything up-to-date
```

- [ ] **Step 4: Create WeChat experience version**

Use WeChat Developer Tools:

```text
上传 -> 填写版本号 0.1.0 -> 填写说明：家庭电费工具第一版
```

Expected: WeChat public platform shows an experience version.

- [ ] **Step 5: Commit release note if any doc changed**

If no files changed, skip this commit.

```bash
git status --short
```

Expected: no uncommitted files.

---

## Self-Review

- Spec coverage: online editing, fixed residents, calculation, local cache, image generation, and Mini Program development flow are covered.
- Placeholder scan: no unresolved placeholders are used.
- Type consistency: `createDefaultState()` and `calculateElectricity(state)` are defined before page tasks consume them.
