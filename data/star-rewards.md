## Star Rewards

### DSA Problems

| Mode           | Solve type           | Easy | Medium | Hard |
| -------------- | -------------------- | ---- | ------ | ---- |
| Normal         | Clean (no hints)     | +3   | +4     | +5   |
| Normal         | With hints           | +1   | +2     | +3   |
| Hard Challenge | Clean                | +6   | +8     | +10  |
| Hard Challenge | With hints           | +2   | +3     | +5   |
| Hard Challenge | Time expired penalty | −2   | −2     | −2   |

All values are admin-configurable via `/admin/config`.

### Quizzes

| Score  | Stars |
| ------ | ----- |
| 100%   | +5    |
| 80–99% | +3    |
| 60–79% | +1    |
| < 60%  | 0     |

Pass threshold is 60% by default, admin-configurable.

### Other Sources

| Event                           | Stars                                                       |
| ------------------------------- | ----------------------------------------------------------- |
| Daily login bonus               | +1 (once per day)                                           |
| Rest day (no problem scheduled) | +5 (once per day, admin-configurable)                       |
| Make-up solve reward            | Stars earned minus attempt cost, first make-up per day only |

---

## Star Shop Items

### Streak Freeze — 20★

Protects your streak for one missed day. If you don't solve on a day, the freeze is consumed and your streak stays intact. You can stack multiple freezes. Consumed automatically when a missed day is detected on next login.

### Problem Skip — 10★

Swaps today's scheduled DSA problem for a random one from the full problem bank. Activated via the **Skip** button in the today page header (only visible when you own at least one). Mode must not be locked (i.e. you haven't started typing yet). Consumed immediately on use.

### Hint Discount — 5★

Reduces the cost of every hint by 1 star for one problem session. Applied automatically when you next purchase any hint — the discount is consumed on the first hint you buy after owning it. Stackable: owning 3 discounts reduces each hint by 1 star across your next 3 hint purchases (one discount consumed per hint purchase).

### Double Stars — 15★

Doubles the star reward on your next solved problem submission. Not yet implemented — purchased but effect not applied. Planned: consumed on next successful `Submit` call.

### Second Chance — 8★

Resets the attempt count on a previously failed problem so you can try again with a clean slate. Not yet implemented — purchased but effect not applied. Planned: applied via a button on the history page expand row for failed problems.

---

## Implementation Status

| Item          | Purchasable | Effect implemented |
| ------------- | ----------- | ------------------ |
| Streak Freeze | ✅          | ✅                 |
| Problem Skip  | ✅          | ✅                 |
| Hint Discount | ✅          | ✅                 |
| Double Stars  | ✅          | ❌ pending         |
| Second Chance | ✅          | ❌ pending         |
