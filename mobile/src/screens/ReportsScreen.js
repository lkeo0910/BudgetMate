import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Circle, G, Path, Rect, Text as SvgText } from "react-native-svg";
import { Card, EmptyState } from "../components/Card";
import { Screen } from "../components/Layout";
import { formatVND } from "../data/finance";
import { useFinanceData } from "../hooks/useFinanceData";
import { colors } from "../theme";

const reportColors = ["#14b8a6", "#22c55e", "#f59e0b", "#3b82f6", "#8b5cf6", "#ef4444"];
const rangeOptions = [
  ["1w", "1W"],
  ["1m", "1M"],
  ["6m", "6M"],
  ["12m", "1Y"],
  ["all", "All"],
  ["custom", "Custom"]
];
const modeOptions = [
  ["overview", "Overview"],
  ["bars", "Bars"],
  ["trend", "Trend"],
  ["flow", "Flow"]
];

export default function ReportsScreen() {
  const { categories, error, hasData, loading, refresh, transactions } = useFinanceData();
  const [range, setRange] = useState("1m");
  const [mode, setMode] = useState("overview");

  const rangeBounds = useMemo(() => getRangeBounds(range, transactions), [range, transactions]);
  const filteredTransactions = useMemo(() => filterTransactions(transactions, rangeBounds), [rangeBounds, transactions]);
  const bucketMode = useMemo(() => getBucketMode(range, rangeBounds), [range, rangeBounds]);
  const cashflowData = useMemo(() => buildCashflowData(filteredTransactions, bucketMode), [bucketMode, filteredTransactions]);
  const totals = useMemo(() => getTotals(filteredTransactions), [filteredTransactions]);
  const expenseRows = useMemo(() => groupByCategory(filteredTransactions, categories, "EXPENSE", 6), [categories, filteredTransactions]);
  const expenseFlowRows = useMemo(() => groupByCategory(filteredTransactions, categories, "EXPENSE"), [categories, filteredTransactions]);
  const incomeRows = useMemo(() => groupByCategory(filteredTransactions, categories, "INCOME"), [categories, filteredTransactions]);
  const averageNet = cashflowData.length ? cashflowData.reduce((sum, item) => sum + item.net, 0) / cashflowData.length : 0;
  const strongest = [...cashflowData].sort((a, b) => b.net - a.net)[0];
  const weakest = [...cashflowData].sort((a, b) => a.net - b.net)[0];

  return (
    <Screen eyebrow="Reports" title="Cash Flow Report" refreshing={loading} onRefresh={refresh}>
      {!!error && <EmptyState title="Could not load reports" message={error} />}
      {!hasData && <EmptyState title="No report data yet" message="Reports will appear after this account has categories and transactions." />}

      <Card style={styles.hero}>
        <View style={styles.rangeLabel}>
          <Ionicons name="calendar-outline" color={colors.text} size={16} />
          <Text numberOfLines={1} style={styles.rangeLabelText}>{getRangeLabel(rangeBounds)}</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rangeButtons}>
          {rangeOptions.map(([id, label]) => (
            <Pressable key={id} style={[styles.rangeButton, range === id && styles.rangeActive]} onPress={() => setRange(id)}>
              <Text style={[styles.rangeText, range === id && styles.rangeTextActive]}>{label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </Card>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsGrid}>
        <SummaryStat label="Total Income" value={formatVND(totals.income)} icon="trending-up-outline" tone={colors.success} />
        <SummaryStat label="Total Expenses" value={formatVND(totals.expense)} icon="trending-down-outline" tone={colors.rose} />
        <SummaryStat label="Total Net Income" value={formatVND(totals.net)} icon="wallet-outline" tone={totals.net >= 0 ? colors.blue : colors.rose} />
        <SummaryStat label="Savings Rate" value={`${Math.round(totals.savingsRate)}%`} icon="leaf-outline" tone={totals.savingsRate >= 0 ? colors.success : colors.rose} />
      </ScrollView>

      <Card>
        <View style={styles.sectionHeader}>
          <View>
            <View style={styles.titleRow}>
              <Ionicons name="bar-chart-outline" color={colors.sky} size={20} />
              <Text style={styles.cardTitle}>Cash Flow</Text>
            </View>
            <Text style={styles.cardHelp}>{getRangeLabel(rangeBounds)}</Text>
          </View>
          <View style={styles.averagePill}>
            <Text style={styles.pillLabel}>Average Net</Text>
            <Text style={[styles.pillValue, averageNet >= 0 ? styles.income : styles.expense]}>{formatVND(averageNet)}</Text>
          </View>
        </View>
        <View style={styles.modeRow}>
          {modeOptions.map(([id, label]) => (
            <Pressable key={id} style={[styles.modeButton, mode === id && styles.modeActive]} onPress={() => setMode(id)}>
              <Text style={[styles.modeText, mode === id && styles.modeTextActive]}>{label}</Text>
            </Pressable>
          ))}
        </View>
        {cashflowData.length ? (
          <CashFlowChart data={cashflowData} mode={mode} totals={totals} expenseRows={expenseFlowRows} incomeRows={incomeRows} />
        ) : (
          <Text style={styles.emptyInline}>No transaction history in this reporting range yet.</Text>
        )}
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Spending Mix</Text>
        <Text style={styles.cardHelp}>Your top expense categories in the selected report range.</Text>
        {expenseRows.length ? (
          <>
            <PieApproximation rows={expenseRows} total={totals.expense} />
            {expenseRows.slice(0, 4).map((item) => (
              <ReportRow key={item.name} item={item} />
            ))}
          </>
        ) : (
          <Text style={styles.emptyInline}>No expense data available yet.</Text>
        )}
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Income Sources</Text>
        <Text style={styles.cardHelp}>Largest income categories recorded in this report range.</Text>
        {incomeRows.length ? (
          <View style={styles.incomeBars}>
            {incomeRows.map((item) => {
              const width = totals.income ? Math.max((item.value / totals.income) * 100, 6) : 0;
              return (
                <View key={item.name} style={styles.incomeBarRow}>
                  <Text style={styles.incomeName}>{item.name}</Text>
                  <View style={styles.incomeTrack}>
                    <View style={[styles.incomeFill, { width: `${width}%` }]} />
                  </View>
                  <Text style={styles.incomeAmount}>{formatVND(item.value)}</Text>
                </View>
              );
            })}
          </View>
        ) : (
          <Text style={styles.emptyInline}>No income sources available yet.</Text>
        )}
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Net Trend</Text>
        <Text style={styles.cardHelp}>A smoother view of how each period finished after expenses.</Text>
        {cashflowData.length ? <NetTrend data={cashflowData} /> : <Text style={styles.emptyInline}>No trend data yet.</Text>}
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Period Highlights</Text>
        <Text style={styles.cardHelp}>Quick takeaways from the selected reporting range.</Text>
        <Highlight title="Strongest Period" item={strongest} positive />
        <Highlight title="Weakest Period" item={weakest} />
      </Card>
    </Screen>
  );
}

function SummaryStat({ label, value, icon, tone }) {
  return (
    <View style={styles.statCard}>
      <View>
        <Text numberOfLines={1} style={styles.statLabel}>{label}</Text>
        <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72} style={styles.statValue}>{value}</Text>
      </View>
      <View style={[styles.statIcon, { backgroundColor: `${tone}20` }]}>
        <Ionicons name={icon} color={tone} size={18} />
      </View>
    </View>
  );
}

function CashFlowChart({ data, mode, totals, expenseRows, incomeRows }) {
  if (mode === "flow") {
    return <FlowDiagram totals={totals} expenseRows={expenseRows} incomeRows={incomeRows} />;
  }

  if (mode === "trend") {
    return <TrendLine data={data} height={220} />;
  }

  if (mode === "overview") {
    return <OverviewChart data={data} />;
  }

  const maxValue = Math.max(...data.flatMap((item) => [item.income, item.expense]), 1);

  return (
    <View style={styles.cashChart}>
      {data.map((item) => (
        <View key={item.label} style={styles.cashBucket}>
          <View style={styles.barPair}>
            <View style={[styles.cashBar, styles.incomeBar, { height: Math.max((item.income / maxValue) * 140, item.income ? 8 : 0) }]} />
            <View style={[styles.cashBar, styles.expenseBar, { height: Math.max((item.expense / maxValue) * 140, item.expense ? 8 : 0) }]} />
          </View>
          <Text style={styles.cashLabel}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

function OverviewChart({ data }) {
  const width = 300;
  const height = 220;
  const chartHeight = 150;
  const maxBar = Math.max(...data.flatMap((item) => [item.income, item.expense]), 1);
  const values = data.map((item) => item.net);
  const maxNet = Math.max(...values, 0);
  const minNet = Math.min(...values, 0);
  const netSpan = Math.max(maxNet - minNet, 1);
  const points = data.map((item, index) => {
    const x = data.length === 1 ? width / 2 : 14 + (index / (data.length - 1)) * (width - 28);
    const y = 24 + ((maxNet - item.net) / netSpan) * 132;
    return { ...item, x, y };
  });

  return (
    <View style={[styles.overviewChart, { width, height }]}>
      <View style={[styles.zeroLine, { top: 24 + (maxNet / netSpan) * 132 }]} />
      {data.map((item, index) => {
        const x = points[index].x;
        return (
          <View key={`${item.label}-bars`} style={[styles.overviewBarPair, { left: x - 9 }]}>
            <View style={[styles.cashBar, styles.incomeBar, { height: Math.max((item.income / maxBar) * chartHeight, item.income ? 8 : 0) }]} />
            <View style={[styles.cashBar, styles.expenseBar, { height: Math.max((item.expense / maxBar) * chartHeight, item.expense ? 8 : 0) }]} />
          </View>
        );
      })}
      <LineSegments points={points} />
      {points.map((point) => (
        <View key={`${point.key || point.label}-overview-dot`} style={[styles.linePoint, styles.netNegative, { left: point.x - 4, top: point.y - 4 }]} />
      ))}
      <View style={styles.lineLabels}>
        {points.slice(0, 6).map((point) => (
          <Text key={`${point.label}-overview-label`} style={styles.cashLabel}>{point.label}</Text>
        ))}
      </View>
    </View>
  );
}

function FlowDiagram({ totals, expenseRows, incomeRows }) {
  const flow = buildFlowModel(totals, expenseRows, incomeRows);
  const chartWidth = 760;
  const chartHeight = 420;
  const nodeWidth = 16;
  const leftX = 122;
  const hubX = 370;
  const rightX = 626;
  const hub = { x: hubX, y: 90, height: 240, center: 210 };
  const maxLinkValue = Math.max(...flow.links.map((item) => item.value), 1);
  const incomeNodes = layoutFlowNodes(flow.incomeNodes, leftX, 70, 270);
  const outputNodes = layoutFlowNodes(flow.outputNodes, rightX, 48, 324);
  const nodeByName = new Map([...incomeNodes, ...outputNodes].map((item) => [item.name, item]));

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.flowScroller} contentContainerStyle={styles.flowScrollContent}>
      <Svg width={chartWidth} height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
        <Rect x="0" y="0" width={chartWidth} height={chartHeight} rx="18" fill="#ecfeff" />
        {flow.links.map((link, index) => {
          const fromNode = nodeByName.get(link.source);
          const toNode = link.target === "Available Cash" ? hub : nodeByName.get(link.target);
          const fromX = link.source === "Available Cash" ? hubX + nodeWidth : (fromNode?.x || leftX) + nodeWidth;
          const fromY = link.source === "Available Cash" ? toNode?.center || hub.center : fromNode?.center || hub.center;
          const toX = link.target === "Available Cash" ? hubX : toNode?.x || rightX;
          const toY = link.target === "Available Cash" ? fromY : toNode?.center || hub.center;
          const curve = link.target === "Available Cash" ? 92 : 118;
          const strokeWidth = Math.max((link.value / maxLinkValue) * 58, 8);
          return (
            <Path
              key={`${link.source}-${link.target}-${index}`}
              d={`M${fromX},${fromY} C${fromX + curve},${fromY} ${toX - curve},${toY} ${toX},${toY}`}
              stroke={link.color}
              strokeOpacity="0.38"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              fill="none"
            />
          );
        })}
        {incomeNodes.map((node) => (
          <FlowNodeSvg key={node.name} node={node} width={nodeWidth} labelSide="right" />
        ))}
        <Rect x={hubX} y={hub.y} width={nodeWidth} height={hub.height} rx="5" fill="#0f172a" />
        <SvgText x={hubX + 24} y={hub.center - 6} fontSize="13" fontWeight="800" fill="#0f172a">Available Cash</SvgText>
        <SvgText x={hubX + 24} y={hub.center + 13} fontSize="12" fill="#334155">{formatVND(flow.availableValue)}</SvgText>
        {outputNodes.map((node) => (
          <FlowNodeSvg key={node.name} node={node} width={nodeWidth} labelSide="left" />
        ))}
      </Svg>
    </ScrollView>
  );
}

function FlowNodeSvg({ node, width, labelSide }) {
  const labelX = labelSide === "left" ? node.x - 8 : node.x + width + 8;
  const anchor = labelSide === "left" ? "end" : "start";
  return (
    <G>
      <Rect x={node.x} y={node.y} width={width} height={node.height} rx="5" fill={node.fill} />
      <SvgText x={labelX} y={node.center - 5} textAnchor={anchor} fontSize="13" fontWeight="800" fill="#0f172a">
        {truncateLabel(node.name, 18)}
      </SvgText>
      <SvgText x={labelX} y={node.center + 14} textAnchor={anchor} fontSize="12" fill="#334155">
        {formatVND(node.value)}
      </SvgText>
    </G>
  );
}

function TrendLine({ data, height = 190 }) {
  const width = 300;
  const values = data.map((item) => item.net);
  const max = Math.max(...values, 0);
  const min = Math.min(...values, 0);
  const span = Math.max(max - min, 1);
  const points = data.map((item, index) => {
    const x = data.length === 1 ? width / 2 : (index / (data.length - 1)) * width;
    const y = 18 + ((max - item.net) / span) * (height - 50);
    return { ...item, x, y };
  });

  return (
    <View style={[styles.lineChart, { height }]}>
      <View style={[styles.zeroLine, { top: 18 + (max / span) * (height - 50) }]} />
      <LineSegments points={points} />
      {points.map((point) => (
        <View key={point.key || point.label} style={[styles.linePoint, point.net >= 0 ? styles.netPositive : styles.netNegative, { left: point.x - 4, top: point.y - 4 }]} />
      ))}
      <View style={styles.lineLabels}>
        {points.slice(0, 6).map((point) => (
          <Text key={`${point.label}-label`} style={styles.cashLabel}>{point.label}</Text>
        ))}
      </View>
    </View>
  );
}

function LineSegments({ points }) {
  return (
    <>
      {points.slice(0, -1).map((point, index) => {
        const next = points[index + 1];
        const dx = next.x - point.x;
        const dy = next.y - point.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = `${Math.atan2(dy, dx)}rad`;
        return (
          <View
            key={`${point.label}-${next.label}-segment`}
            style={[
              styles.lineSegment,
              {
                width: length,
                left: point.x + dx / 2 - length / 2,
                top: point.y + dy / 2,
                transform: [{ rotate: angle }]
              }
            ]}
          />
        );
      })}
    </>
  );
}

function PieApproximation({ rows, total }) {
  const size = 188;
  const center = size / 2;
  const radius = 68;
  const strokeWidth = 32;
  const gap = 3;
  let startAngle = -90;

  return (
    <View style={styles.pieBlock}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle cx={center} cy={center} r={radius} stroke="#f1f5f9" strokeWidth={strokeWidth} fill="none" />
        {rows.slice(0, 6).map((item) => {
          const sweep = total ? (item.value / total) * 360 : 0;
          const path = describeArc(center, center, radius, startAngle + gap / 2, startAngle + sweep - gap / 2);
          startAngle += sweep;
          return <Path key={item.name} d={path} stroke={item.color} strokeWidth={strokeWidth} strokeLinecap="butt" fill="none" />;
        })}
        <Circle cx={center} cy={center} r={44} fill={colors.surface} />
      </Svg>
      <View style={styles.legendWrap}>
        {rows.slice(0, 6).map((item) => (
          <View key={item.name} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: item.color }]} />
            <Text style={styles.legendText}>{item.name}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function ReportRow({ item }) {
  return (
    <View style={styles.reportRow}>
      <View style={[styles.legendDot, { backgroundColor: item.color }]} />
      <Text style={styles.reportName}>{item.name}</Text>
      <Text style={styles.reportValue}>{formatVND(item.value)}</Text>
    </View>
  );
}

function NetTrend({ data }) {
  return <TrendLine data={data} height={190} />;
}

function Highlight({ title, item, positive }) {
  return (
    <View style={[styles.highlight, positive ? styles.highlightGood : styles.highlightBad]}>
      <Text style={styles.highlightLabel}>{title}</Text>
      <Text style={styles.highlightTitle}>{item?.label || "No data"}</Text>
      <Text style={styles.highlightCopy}>Net income {item ? `reached ${formatVND(item.net)}` : "is not available"}.</Text>
    </View>
  );
}

function filterTransactions(transactions, bounds) {
  if (!bounds.from || !bounds.to) {
    return [...transactions].sort(sortByDate);
  }
  return transactions.filter((item) => {
    const date = parseDate(item.date);
    return date >= bounds.from && date <= bounds.to;
  }).sort(sortByDate);
}

function buildCashflowData(transactions, bucketMode) {
  const buckets = new Map();
  transactions.forEach((item) => {
    const date = parseDate(item.date);
    const key = getBucketKey(date, bucketMode);
    const label = getBucketLabel(date, bucketMode);
    const current = buckets.get(key) || { key, label, sortDate: date, income: 0, expense: 0, net: 0 };
    if (item.type === "INCOME") current.income += item.amount;
    else current.expense += item.amount;
    current.net = current.income - current.expense;
    buckets.set(key, current);
  });
  return Array.from(buckets.values()).sort((a, b) => a.sortDate - b.sortDate);
}

function getTotals(transactions) {
  const income = transactions.filter((item) => item.type === "INCOME").reduce((sum, item) => sum + item.amount, 0);
  const expense = transactions.filter((item) => item.type === "EXPENSE").reduce((sum, item) => sum + item.amount, 0);
  const net = income - expense;
  return { income, expense, net, savingsRate: income > 0 ? (net / income) * 100 : 0 };
}

function groupByCategory(transactions, categories, type, limit = Infinity) {
  const map = new Map();
  transactions
    .filter((item) => item.type === type)
    .forEach((item) => {
      map.set(item.category, (map.get(item.category) || 0) + item.amount);
    });
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, value], index) => ({ name, value, color: type === "EXPENSE" ? reportColors[index % reportColors.length] : categories.find((item) => item.name === name)?.color || "#10b981" }));
}

function buildFlowModel(totals, expenseRows, incomeRows) {
  const expenseEntries = expenseRows.length > 5
    ? [
        ...expenseRows.slice(0, 4),
        {
          name: "Other Expenses",
          value: expenseRows.slice(4).reduce((sum, item) => sum + item.value, 0),
          color: "#94a3b8"
        }
      ]
    : expenseRows;
  const deficitValue = Math.max(totals.expense - totals.income, 0);
  const incomeNodes = [
    ...incomeRows.map((entry) => ({ name: entry.name, value: entry.value, fill: "#38bdf8" })),
    ...(deficitValue > 0 ? [{ name: "Deficit Funding", value: deficitValue, fill: "#f59e0b" }] : [])
  ];
  const outputNodes = [
    ...(totals.net > 0 ? [{ name: "Savings", value: totals.net, fill: "#16a34a" }] : []),
    ...expenseEntries.map((entry) => ({ name: entry.name, value: entry.value, fill: entry.color }))
  ];
  const links = [
    ...incomeRows.map((entry) => ({ source: entry.name, target: "Available Cash", value: entry.value, color: "#93c5fd" })),
    ...(deficitValue > 0 ? [{ source: "Deficit Funding", target: "Available Cash", value: deficitValue, color: "#fbbf24" }] : []),
    ...(totals.net > 0 ? [{ source: "Available Cash", target: "Savings", value: totals.net, color: "#86efac" }] : []),
    ...expenseEntries.map((entry) => ({ source: "Available Cash", target: entry.name, value: entry.value, color: entry.color }))
  ];

  if (!incomeNodes.length && !outputNodes.length) {
    return {
      incomeNodes: [{ name: "Income", value: 0, fill: "#38bdf8" }],
      outputNodes: [{ name: "No activity", value: 0, fill: "#94a3b8" }],
      links: [],
      availableValue: 0
    };
  }

  return { incomeNodes, outputNodes, links, availableValue: totals.income + deficitValue };
}

function layoutFlowNodes(nodes, x, top, height) {
  const count = Math.max(nodes.length, 1);
  const gap = count > 1 ? 12 : 0;
  const availableHeight = height - gap * (count - 1);
  const totalValue = nodes.reduce((sum, item) => sum + item.value, 0) || 1;
  let cursor = top;
  return nodes.map((item) => {
    const weightedHeight = (item.value / totalValue) * availableHeight;
    const nodeHeight = Math.min(Math.max(weightedHeight, item.value ? 18 : 12), 78);
    const node = { ...item, x, y: cursor, height: nodeHeight, center: cursor + nodeHeight / 2 };
    cursor += nodeHeight + gap;
    return node;
  });
}

function describeArc(cx, cy, radius, startAngle, endAngle) {
  if (endAngle <= startAngle) return "";
  const start = polarToCartesian(cx, cy, radius, endAngle);
  const end = polarToCartesian(cx, cy, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

function polarToCartesian(cx, cy, radius, angleInDegrees) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(angleInRadians),
    y: cy + radius * Math.sin(angleInRadians)
  };
}

function truncateLabel(label, maxLength) {
  return label.length <= maxLength ? label : `${label.slice(0, maxLength - 1)}...`;
}

function getRangeBounds(range, transactions) {
  if (range === "all") {
    const dates = transactions.map((item) => parseDate(item.date)).filter((item) => !Number.isNaN(item.getTime())).sort((a, b) => a - b);
    return { from: dates[0] || null, to: dates[dates.length - 1] || null };
  }

  const to = startOfDay(new Date());
  const from = new Date(to);
  if (range === "1w") from.setDate(to.getDate() - 6);
  if (range === "1m" || range === "custom") from.setMonth(to.getMonth() - 1);
  if (range === "6m") from.setMonth(to.getMonth() - 5);
  if (range === "12m") from.setMonth(to.getMonth() - 11);
  return { from: startOfDay(from), to };
}

function getBucketMode(range, bounds) {
  if (range === "1w" || range === "1m" || range === "custom") return "day";
  if (range === "6m") return "week";
  if (range === "all" && bounds.from && bounds.to) {
    const days = Math.max((bounds.to - bounds.from) / 86400000, 1);
    if (days <= 31) return "day";
    if (days <= 120) return "week";
  }
  return "month";
}

function getRangeLabel(bounds) {
  if (!bounds.from || !bounds.to) return "No report range";
  return `${formatDateLabel(bounds.from)} - ${formatDateLabel(bounds.to)}`;
}

function parseDate(value) {
  const [year, month, day] = String(value).split("-").map(Number);
  return new Date(year, month - 1, day);
}

function startOfDay(value) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function getBucketKey(date, mode) {
  if (mode === "month") return `${date.getFullYear()}-${date.getMonth()}`;
  if (mode === "week") {
    const weekStart = startOfDay(date);
    weekStart.setDate(date.getDate() - date.getDay());
    return `${weekStart.getFullYear()}-${weekStart.getMonth()}-${weekStart.getDate()}`;
  }
  return date.toISOString().slice(0, 10);
}

function getBucketLabel(date, mode) {
  if (mode === "month") return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
  if (mode === "week") {
    const weekStart = startOfDay(date);
    weekStart.setDate(date.getDate() - date.getDay());
    return formatDateLabel(weekStart);
  }
  return formatDateLabel(date);
}

function formatDateLabel(value) {
  return value.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function sortByDate(a, b) {
  return parseDate(a.date) - parseDate(b.date);
}

const styles = StyleSheet.create({
  hero: { backgroundColor: "#f8fafc", borderColor: "#d1fae5", paddingVertical: 12 },
  heroCopy: { color: colors.text, lineHeight: 21, fontWeight: "700" },
  rangeLabel: { minHeight: 38, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12 },
  rangeLabelText: { flex: 1, color: colors.text, fontWeight: "800", fontSize: 12 },
  rangeButtons: { flexDirection: "row", gap: 8, marginTop: 10, paddingRight: 2 },
  rangeButton: { minHeight: 36, minWidth: 52, borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", paddingHorizontal: 10 },
  rangeActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  rangeText: { color: colors.ink, fontWeight: "900", fontSize: 12 },
  rangeTextActive: { color: colors.surface },
  statsGrid: { paddingHorizontal: 16, paddingTop: 14, gap: 8 },
  statCard: { width: 132, minHeight: 76, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 7 },
  statLabel: { color: colors.muted, fontWeight: "800", fontSize: 10 },
  statValue: { color: colors.ink, fontSize: 15, fontWeight: "900", marginTop: 6 },
  statIcon: { width: 30, height: 30, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  sectionHeader: { gap: 12 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardTitle: { color: colors.ink, fontSize: 20, fontWeight: "900" },
  cardHelp: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 8 },
  averagePill: { alignSelf: "flex-start", borderRadius: 14, backgroundColor: "#f8fafc", paddingHorizontal: 14, paddingVertical: 10 },
  pillLabel: { color: colors.muted, fontSize: 10, fontWeight: "900", textTransform: "uppercase", letterSpacing: 1.6 },
  pillValue: { fontWeight: "900", marginTop: 4 },
  modeRow: { flexDirection: "row", gap: 5, marginTop: 14 },
  modeButton: { minHeight: 34, flex: 1, borderRadius: 8, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 4, justifyContent: "center", alignItems: "center" },
  modeActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  modeText: { color: colors.text, fontWeight: "800", fontSize: 11 },
  modeTextActive: { color: colors.surface },
  cashChart: { height: 220, flexDirection: "row", alignItems: "flex-end", gap: 8, marginTop: 18, borderLeftWidth: 1, borderBottomWidth: 1, borderColor: colors.border, paddingHorizontal: 8 },
  cashBucket: { flex: 1, height: 200, alignItems: "center", justifyContent: "flex-end", position: "relative" },
  barPair: { flexDirection: "row", alignItems: "flex-end", gap: 3 },
  cashBar: { width: 8, borderTopLeftRadius: 6, borderTopRightRadius: 6 },
  incomeBar: { backgroundColor: "#22c55e" },
  expenseBar: { backgroundColor: "#7c3aed" },
  netDot: { position: "absolute", width: 9, height: 9, borderRadius: 5, borderWidth: 2, borderColor: colors.surface },
  netPositive: { backgroundColor: colors.success },
  netNegative: { backgroundColor: colors.rose },
  cashLabel: { color: colors.muted, fontSize: 9, fontWeight: "800", marginTop: 8 },
  overviewChart: { alignSelf: "center", marginTop: 18, borderLeftWidth: 1, borderBottomWidth: 1, borderColor: colors.border, position: "relative", overflow: "hidden" },
  overviewBarPair: { position: "absolute", bottom: 25, flexDirection: "row", alignItems: "flex-end", gap: 3 },
  flowScroller: { height: 420, marginTop: 18, borderRadius: 18, backgroundColor: "#ecfeff" },
  flowScrollContent: { width: 760 },
  flowDiagram: { height: 420, marginTop: 18, borderRadius: 18, backgroundColor: "#ecfeff", overflow: "hidden", position: "relative" },
  flowIncomingBand: { position: "absolute", left: "10%", right: "58%", top: 79, borderRadius: 999, backgroundColor: "#bfdbfe" },
  flowDeficitBand: { position: "absolute", left: "10%", right: "58%", top: 138, borderRadius: 999, backgroundColor: "#fde68a" },
  flowIncomeRail: { position: "absolute", left: "8%", top: 62, width: 10, height: 132, borderRadius: 6, backgroundColor: "#38bdf8" },
  flowCenterRail: { position: "absolute", left: "40%", top: 62, width: 10, height: 132, borderRadius: 6, backgroundColor: colors.ink },
  flowLeftLabel: { position: "absolute", left: "14%", top: 111, width: "22%" },
  flowDeficitLabel: { position: "absolute", left: "14%", top: 152, width: "22%" },
  flowCenterLabel: { position: "absolute", left: "45%", top: 111, width: "24%" },
  flowBandWrap: { position: "absolute", left: "42%", right: 8, minHeight: 32 },
  flowBand: { position: "absolute", left: 0, right: 78, top: 9, borderRadius: 999 },
  flowEndCap: { position: "absolute", right: 72, top: 6, width: 10, borderRadius: 6 },
  flowRightText: { position: "absolute", right: 0, top: 0, width: 76, alignItems: "flex-start" },
  flowLabel: { color: colors.text, fontWeight: "900", fontSize: 9 },
  flowSmallValue: { color: colors.text, fontSize: 8, marginTop: 2 },
  lineChart: { width: 320, maxWidth: "100%", alignSelf: "center", marginTop: 18, borderLeftWidth: 1, borderBottomWidth: 1, borderColor: colors.border, position: "relative", overflow: "hidden" },
  zeroLine: { position: "absolute", left: 0, right: 0, height: 1, backgroundColor: "#dbeafe" },
  lineSegment: { position: "absolute", height: 2, borderRadius: 2, backgroundColor: "#0f766e" },
  linePoint: { position: "absolute", width: 8, height: 8, borderRadius: 4, borderWidth: 2, borderColor: colors.surface },
  lineLabels: { position: "absolute", left: 0, right: 0, bottom: 0, flexDirection: "row", justifyContent: "space-between" },
  pieBlock: { alignItems: "center", marginTop: 22 },
  pieWrap: { width: 178, height: 178, borderRadius: 89, backgroundColor: "#f1f5f9", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  pieSlice: { position: "absolute", borderRadius: 999 },
  pieHole: { width: 94, height: 94, borderRadius: 47, backgroundColor: colors.surface },
  legendWrap: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8, marginTop: 14 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { color: colors.text, fontSize: 12, fontWeight: "800" },
  reportRow: { minHeight: 44, borderRadius: 12, backgroundColor: "#f8fafc", flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, marginTop: 8 },
  reportName: { flex: 1, color: colors.text, fontWeight: "800" },
  reportValue: { color: colors.ink, fontWeight: "900", fontSize: 12 },
  incomeBars: { marginTop: 18, gap: 14 },
  incomeBarRow: { gap: 6 },
  incomeName: { color: colors.text, fontWeight: "800", fontSize: 12 },
  incomeTrack: { height: 34, borderRadius: 8, backgroundColor: "#f1f5f9", overflow: "hidden" },
  incomeFill: { height: 34, borderRadius: 8, backgroundColor: "#14b8a6" },
  incomeAmount: { color: colors.ink, fontWeight: "900", fontSize: 12 },
  highlight: { borderRadius: 14, padding: 16, marginTop: 14, borderWidth: 1 },
  highlightGood: { backgroundColor: "#ecfdf5", borderColor: "#bbf7d0" },
  highlightBad: { backgroundColor: "#fff1f2", borderColor: "#fecdd3" },
  highlightLabel: { color: colors.muted, fontSize: 11, fontWeight: "900", textTransform: "uppercase", letterSpacing: 1.8 },
  highlightTitle: { color: colors.ink, fontSize: 20, fontWeight: "900", marginTop: 14 },
  highlightCopy: { color: colors.text, marginTop: 10, fontWeight: "700" },
  emptyInline: { color: colors.muted, fontWeight: "800", lineHeight: 20, marginTop: 14 },
  income: { color: colors.success },
  expense: { color: colors.rose }
});
