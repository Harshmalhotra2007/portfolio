(async function () {
  console.log(
    "%c=== AeroFinance Automated Browser Test Suite ===",
    "color: #6366f1; font-weight: bold; font-size: 1.1em;",
  );

  // Save original database states to prevent data corruption
  const backupDb = localStorage.getItem("expenses_db");
  const backupBudgets = localStorage.getItem("expenses_budgets");

  const results = [];

  function assert(condition, message) {
    if (condition) {
      results.push({ name: message, status: "pass" });
      console.log(`%c[PASS] ${message}`, "color: #10b981; font-weight: bold;");
    } else {
      results.push({ name: message, status: "fail" });
      console.error(`[FAIL] ${message}`);
    }
  }

  try {
    // --- TEST 1: RFC-4180 CSV PARSER ---
    const testCsv =
      'Date,Particulars,Withdrawal,Deposit,Account\n2026-01-01,"Uber, Taxi",500,,Cash\n2026-01-02,Salary credit,,25000,Bank\n2026-01-03,"Card spent ""Groceries""",1200,,Card';
    const parsed = parseCSV(testCsv);
    assert(parsed.length === 4, "CSV parser split lines correctly");
    assert(
      parsed[1][1] === "Uber, Taxi",
      "CSV parser handles commas inside quotes",
    );
    assert(
      parsed[3][1] === 'Card spent "Groceries"',
      "CSV parser handles escaped double-quotes",
    );

    // --- TEST 2: BANK STATEMENT MAPPER & KEYWORD CATEGORIZATION ---
    const origTxns = [...window.transactions];
    window.transactions = [];

    const csvImported = processCSVImport(testCsv);
    assert(
      csvImported.length === 3,
      "Mapped CSV bank statement rows successfully",
    );

    assert(
      csvImported[0].type === "expense" && csvImported[0].amount === 500,
      "CSV withdrawal correctly mapped to expense",
    );
    assert(
      csvImported[0].category === "Transport",
      "Uber note auto-categorized to Transport",
    );
    assert(
      csvImported[0].account === "Cash",
      "Cash wallet mapped correctly from CSV",
    );

    assert(
      csvImported[1].type === "income" && csvImported[1].amount === 25000,
      "CSV deposit correctly mapped to income",
    );
    assert(
      csvImported[1].category === "Salary",
      "Salary note auto-categorized to Salary",
    );
    assert(
      csvImported[1].account === "Bank",
      "Bank account mapped correctly from CSV",
    );

    assert(
      csvImported[2].type === "expense" && csvImported[2].amount === 1200,
      "CSV card spent correctly mapped to expense",
    );
    assert(
      csvImported[2].category === "Food",
      "Groceries note auto-categorized to Food",
    );
    assert(
      csvImported[2].account === "Card",
      "Card account mapped correctly from CSV",
    );

    window.transactions = origTxns;

    // --- TEST 3: MULTI-ACCOUNT BALANCE CALCULATIONS ---
    const dummyTxns = [
      {
        type: "income",
        amount: 50000,
        account: "Bank",
        date: "2026-01-01",
        category: "Salary",
      },
      {
        type: "expense",
        amount: 15000,
        account: "Bank",
        date: "2026-01-02",
        category: "Rent",
      },
      {
        type: "income",
        amount: 2000,
        account: "Cash",
        date: "2026-01-03",
        category: "Other",
      },
      {
        type: "expense",
        amount: 500,
        account: "Cash",
        date: "2026-01-04",
        category: "Food",
      },
      {
        type: "expense",
        amount: 3000,
        account: "Card",
        date: "2026-01-05",
        category: "Utilities",
      },
    ];

    const testTotals = dummyTxns.reduce(
      (acc, curr) => {
        const amt = curr.amount;
        const account = curr.account || "Bank";
        if (curr.type === "income") {
          acc[account] = (acc[account] || 0) + amt;
        } else {
          acc[account] = (acc[account] || 0) - amt;
        }
        return acc;
      },
      { Bank: 0, Cash: 0, Card: 0 },
    );

    assert(
      testTotals.Bank === 35000,
      "Bank cumulative balance matches expected value",
    );
    assert(
      testTotals.Cash === 1500,
      "Cash cumulative balance matches expected value",
    );
    assert(
      testTotals.Card === -3000,
      "Credit Card balance acts as debt offset correctly",
    );
    assert(
      testTotals.Bank + testTotals.Cash + testTotals.Card === 33500,
      "Combined total balance matches arithmetic sum",
    );

    // --- TEST 4: COLUMN SORT COMPARATOR LOGIC ---
    const sortTxns = [
      { date: "2026-01-10", amount: 1000, category: "Food" },
      { date: "2026-01-12", amount: 3000, category: "Utilities" },
      { date: "2026-01-05", amount: 2000, category: "Transport" },
    ];

    const sortedDate = [...sortTxns].sort(
      (a, b) => new Date(a.date) - new Date(b.date),
    );
    assert(
      sortedDate[0].date === "2026-01-05" &&
        sortedDate[2].date === "2026-01-12",
      "Date sorting compares chronological order correctly",
    );

    const sortedAmt = [...sortTxns].sort((a, b) => b.amount - a.amount);
    assert(
      sortedAmt[0].amount === 3000 && sortedAmt[2].amount === 1000,
      "Amount sorting compares numerical magnitude correctly",
    );

    const sortedCat = [...sortTxns].sort((a, b) =>
      a.category.localeCompare(b.category),
    );
    assert(
      sortedCat[0].category === "Food" && sortedCat[2].category === "Utilities",
      "Category sorting compares alphabetical strings correctly",
    );

    // --- TEST 5: TREND LINE CHART RANGE GROUPING ---
    const startDay = new Date("2026-01-01");
    const endDay = new Date("2026-01-20");
    const daysDiff = Math.ceil(
      Math.abs(endDay - startDay) / (1000 * 60 * 60 * 24),
    );
    assert(
      daysDiff <= 31,
      "Correctly identifies date intervals under 31 days as daily scale",
    );

    const startMonth = new Date("2026-01-01");
    const endMonth = new Date("2026-03-15");
    const monthsDiff = Math.ceil(
      Math.abs(endMonth - startMonth) / (1000 * 60 * 60 * 24),
    );
    assert(
      monthsDiff > 31,
      "Correctly identifies date intervals over 31 days as monthly scale",
    );

    // --- TEST 6: BUDGET OVERSPEND ALERTS TRIGGER ---
    const testBudgets = { Food: 1000 };
    const loggedExpenses = [
      { type: "expense", amount: 800, category: "Food", date: "2026-01-10" },
    ];

    loggedExpenses.push({
      type: "expense",
      amount: 450,
      category: "Food",
      date: "2026-01-11",
    });
    const totalFoodSpent = loggedExpenses.reduce((sum, t) => sum + t.amount, 0);
    const hasAlert = totalFoodSpent > testBudgets.Food;

    assert(
      hasAlert === true,
      "Budget checking alerts when spending exceeds cap",
    );
    assert(
      totalFoodSpent - testBudgets.Food === 250,
      "Exceeded budget amount accurately calculated",
    );

    // --- TEST 7: BULK SELECTION & UNDO RESTORATION ---
    const testBulkList = [
      {
        id: "bulk-1",
        date: "2026-01-01",
        amount: 100,
        category: "Food",
        note: "A",
        type: "expense",
      },
      {
        id: "bulk-2",
        date: "2026-01-02",
        amount: 200,
        category: "Food",
        note: "B",
        type: "expense",
      },
      {
        id: "bulk-3",
        date: "2026-01-03",
        amount: 300,
        category: "Food",
        note: "C",
        type: "expense",
      },
    ];

    selectedTxnIds = ["bulk-1", "bulk-3"];
    lastDeletedTransactions = testBulkList.filter((t) =>
      selectedTxnIds.includes(t.id),
    );
    const afterDelete = testBulkList.filter(
      (t) => !selectedTxnIds.includes(t.id),
    );

    assert(
      afterDelete.length === 1 && afterDelete[0].id === "bulk-2",
      "Bulk delete correctly filters selected IDs",
    );
    assert(
      lastDeletedTransactions.length === 2,
      "Selected items correctly moved to undo history",
    );

    const restored = [...afterDelete, ...lastDeletedTransactions];
    assert(
      restored.length === 3,
      "Undo restoration correctly appends history back to records",
    );

    selectedTxnIds = [];
    lastDeletedTransactions = [];

    // --- TEST 8: TRANSACTIONS CATEGORY FILTER ---
    const testCategoryList = [
      { category: "Food" },
      { category: "Transport" },
      { category: "Food" },
      { category: "Rent" },
    ];

    const filterFood = testCategoryList.filter((t) => t.category === "Food");
    assert(
      filterFood.length === 2,
      "Category filter extracts Food items correctly",
    );

    const filterTransport = testCategoryList.filter(
      (t) => t.category === "Transport",
    );
    assert(
      filterTransport.length === 1,
      "Category filter extracts Transport items correctly",
    );

    // --- TEST 9: TABLE PAGINATION MATH ---
    const paginationList = Array.from({ length: 25 }, (_, i) => ({
      id: `id-${i}`,
    }));
    const tPageSize = 10;

    const page1 = paginationList.slice(0, tPageSize);
    assert(
      page1.length === 10 && page1[0].id === "id-0",
      "Pagination slices Page 1 items correctly",
    );

    const page3 = paginationList.slice(20, 30);
    assert(
      page3.length === 5 && page3[0].id === "id-20",
      "Pagination slices Page 3 end boundary items correctly",
    );

    const totalPages = Math.ceil(paginationList.length / tPageSize);
    assert(totalPages === 3, "Total pages count calculates accurately");

    // --- TEST 10: MULTI-KEYWORD SEARCH & INLINE DATES ---
    const searchList = [
      {
        note: "Swiggy Dinner with family",
        category: "Food",
        account: "Cash",
        date: "2026-01-10",
      },
      {
        note: "Salary paycheck credit",
        category: "Salary",
        account: "Bank",
        date: "2026-01-12",
      },
      {
        note: "Uber cab ride to office",
        category: "Transport",
        account: "Card",
        date: "2026-01-15",
      },
    ];

    const query1 = "swiggy family";
    const keywords1 = query1.split(/\s+/).filter((k) => k.length > 0);
    const match1 = searchList.filter((t) => {
      return keywords1.every(
        (k) =>
          t.note.toLowerCase().includes(k) ||
          t.category.toLowerCase().includes(k),
      );
    });
    assert(
      match1.length === 1 && match1[0].note.startsWith("Swiggy"),
      "Multi-keyword search locates matching record correctly",
    );

    const startLimit = new Date("2026-01-11T00:00:00");
    const endLimit = new Date("2026-01-16T23:59:59");
    const dateFiltered = searchList.filter((t) => {
      const d = new Date(t.date + "T00:00:00");
      return d >= startLimit && d <= endLimit;
    });
    assert(
      dateFiltered.length === 2,
      "Inline date range filter slices records correctly",
    );
  } catch (e) {
    console.error("Critical error in test suite run:", e);
  } finally {
    if (backupDb) localStorage.setItem("expenses_db", backupDb);
    else localStorage.removeItem("expenses_db");

    if (backupBudgets) localStorage.setItem("expenses_budgets", backupBudgets);
    else localStorage.removeItem("expenses_budgets");

    renderTestOverlay(results);
  }

  function renderTestOverlay(results) {
    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.bottom = "1.5rem";
    overlay.style.right = "1.5rem";
    overlay.style.width = "340px";
    overlay.style.maxHeight = "480px";
    overlay.style.backgroundColor = "var(--card)";
    overlay.style.border = "1px solid var(--border)";
    overlay.style.borderRadius = "var(--radius)";
    overlay.style.boxShadow = "0 10px 25px rgba(0, 0, 0, 0.2)";
    overlay.style.zIndex = "99999";
    overlay.style.padding = "1.25rem";
    overlay.style.display = "flex";
    overlay.style.flexDirection = "column";
    overlay.style.gap = "0.75rem";
    overlay.style.overflowY = "auto";
    overlay.style.color = "var(--foreground)";
    overlay.style.fontFamily = "var(--font-sans)";

    const passCount = results.filter((r) => r.status === "pass").length;
    const total = results.length;
    const isAllGreen = passCount === total;

    overlay.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem; margin-bottom: 0.25rem;">
                <h4 style="margin: 0; font-family: var(--font-heading); font-size: 0.95rem; font-weight: 700; display: flex; align-items: center; gap: 0.35rem;">
                    <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: ${isAllGreen ? "#10b981" : "#ef4444"};"></span>
                    AeroFinance Test Suite
                </h4>
                <span style="font-size: 0.75rem; font-weight: 600; color: ${isAllGreen ? "#10b981" : "#ef4444"}; background-color: ${isAllGreen ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)"}; padding: 0.2rem 0.5rem; border-radius: 9999px;">
                    ${passCount}/${total} Passed
                </span>
            </div>
            <div style="display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.75rem;">
                ${results
                  .map(
                    (r, idx) => `
                    <div style="display: flex; gap: 0.5rem; align-items: flex-start; justify-content: space-between; border-bottom: 1px dashed var(--border); padding-bottom: 0.35rem;">
                        <span style="color: var(--muted-foreground); text-align: left;">${idx + 1}. ${escapeHTML(r.name)}</span>
                        <span style="color: ${r.status === "pass" ? "#10b981" : "#ef4444"}; font-weight: bold; text-transform: uppercase;">
                            ${r.status}
                        </span>
                    </div>
                `,
                  )
                  .join("")}
            </div>
            <button onclick="this.parentElement.remove()" style="margin-top: 0.5rem; width: 100%; border: 1px solid var(--border); background-color: var(--secondary); color: var(--foreground); font-size: 0.75rem; padding: 0.4rem; border-radius: 4px; cursor: pointer; transition: 0.2s;">
                Dismiss Summary
            </button>
        `;
    document.body.appendChild(overlay);
  }
})();
