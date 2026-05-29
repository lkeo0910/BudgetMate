import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from "react-native-svg";
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
  const { width } = useWindowDimensions();
  const [range, setRange] = useState("1m");
  const [mode, setMode] = useState("overview");
  const [selectedPoint, setSelectedPoint] = useState(null);
  const chartWidth = Math.min(Math.max(width - 64, 256), 366);

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
        <SummaryStat label="Total Income" value={formatCompactCurrency(totals.income)} icon="trending-up-outline" tone={colors.success} />
        <SummaryStat label="Total Expenses" value={formatCompactCurrency(totals.expense)} icon="trending-down-outline" tone={colors.rose} />
        <SummaryStat label="Net Income" value={formatCompactCurrency(totals.net)} icon="wallet-outline" tone={totals.net >= 0 ? colors.blue : colors.rose} />
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
              <Pressable key={id} style={[styles.modeButton, mode === id && styles.modeActive]} onPress={() => { setMode(id); setSelectedPoint(null); }}>
                <Text style={[styles.modeText, mode === id && styles.modeTextActive]}>{label}</Text>
              </Pressable>
            ))}
        </View>
        {cashflowData.length ? (
          <CashFlowChart
            data={cashflowData}
            mode={mode}
            totals={totals}
            expenseRows={expenseFlowRows}
            incomeRows={incomeRows}
            chartWidth={chartWidth}
            selectedPoint={selectedPoint}
            onSelectPoint={setSelectedPoint}
          />
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
        {cashflowData.length ? <NetTrend data={cashflowData} chartWidth={chartWidth} /> : <Text style={styles.emptyInline}>No trend data yet.</Text>}
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
      <View style={styles.statCopy}>
        <Text numberOfLines={1} style={styles.statLabel}>{label}</Text>
        <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72} style={styles.statValue}>{value}</Text>
      </View>
      <View style={[styles.statIcon, { backgroundColor: `${tone}20` }]}>
        <Ionicons name={icon} color={tone} size={18} />
      </View>
    </View>
  );
}

function CashFlowChart({ data, mode, totals, expenseRows, incomeRows, chartWidth, selectedPoint, onSelectPoint }) {
  if (mode === "flow") {
    return <FlowDiagram totals={totals} expenseRows={expenseRows} incomeRows={incomeRows} />;
  }

  if (mode === "trend") {
    return <TrendLine data={data} height={230} width={chartWidth} selected={selectedPoint} onSelect={onSelectPoint} />;
  }

  if (mode === "overview") {
    return <OverviewChart data={data} width={chartWidth} selected={selectedPoint} onSelect={onSelectPoint} />;
  }

  return <BarChart data={data} width={chartWidth} selected={selectedPoint} onSelect={onSelectPoint} />;
}

function OverviewChart({ data, width, selected, onSelect }) {
  const height = 244;
  const contentWidth = getChartContentWidth(data.length, width);
  const geometry = getChartGeometry(contentWidth, height);
  const maxBar = Math.max(...data.flatMap((item) => [item.income, item.expense]), 1);
  const netScale = getValueScale(data.map((item) => item.net), 4);
  const labelIndexes = getLabelIndexes(data.length);
  const points = getSeriesPoints(data, geometry, netScale, "net");
  const selectedItem = selected || data[data.length - 1];
  const path = buildPolylinePath(points);

  return (
    <View>
      <ChartLegend />
      <ScrollView horizontal={contentWidth > width} showsHorizontalScrollIndicator={false} style={styles.chartScroller}>
        <View style={[styles.chartCanvas, { width: contentWidth, height }]}>
          <Svg width={contentWidth} height={height} viewBox={`0 0 ${contentWidth} ${height}`}>
            <ChartGrid geometry={geometry} scale={netScale} />
            {data.map((item, index) => {
              const x = points[index].x;
              const barMaxHeight = geometry.chartHeight * 0.5;
              const incomeHeight = item.income ? Math.max((item.income / maxBar) * barMaxHeight, 4) : 0;
              const expenseHeight = item.expense ? Math.max((item.expense / maxBar) * barMaxHeight, 4) : 0;
              const baseY = geometry.bottom - 2;
              return (
                <G key={`${item.key}-overview-bars`}>
                  <Rect x={x - 11} y={baseY - incomeHeight} width="8" height={incomeHeight} rx="4" fill="#22c55e" />
                  <Rect x={x + 3} y={baseY - expenseHeight} width="8" height={expenseHeight} rx="4" fill="#7c3aed" />
                </G>
              );
            })}
            {path ? <Path d={path} stroke="#0f766e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" /> : null}
            {points.map((point) => (
              <Circle
                key={`${point.key}-overview-point`}
                cx={point.x}
                cy={point.y}
                r={selectedItem?.key === point.key ? 6 : 4}
                fill={point.net >= 0 ? colors.success : colors.rose}
                stroke={colors.surface}
                strokeWidth="2"
              />
            ))}
            <AxisLabels geometry={geometry} scale={netScale} />
            <BottomLabels data={data} points={points} labelIndexes={labelIndexes} bottom={geometry.bottom} />
          </Svg>
          {points.map((point) => (
            <Pressable key={`${point.key}-overview-hit`} accessibilityLabel={`Show ${point.label}`} style={[styles.chartHitTarget, { left: point.x - 18, top: point.y - 18 }]} onPress={() => onSelect?.(point)} />
          ))}
        </View>
      </ScrollView>
      <PointDetails point={selectedItem} />
    </View>
  );
}

function BarChart({ data, width, selected, onSelect }) {
  const height = 238;
  const contentWidth = getChartContentWidth(data.length, width);
  const geometry = getChartGeometry(contentWidth, height);
  const scale = getValueScale(data.flatMap((item) => [item.income, item.expense]), 0);
  const labelIndexes = getLabelIndexes(data.length);
  const points = getSeriesPoints(data, geometry, scale, "income");
  const selectedItem = selected || data[data.length - 1];

  return (
    <View>
      <ChartLegend />
      <ScrollView horizontal={contentWidth > width} showsHorizontalScrollIndicator={false} style={styles.chartScroller}>
        <View style={[styles.chartCanvas, { width: contentWidth, height }]}>
          <Svg width={contentWidth} height={height} viewBox={`0 0 ${contentWidth} ${height}`}>
            <ChartGrid geometry={geometry} scale={scale} />
            {data.map((item, index) => {
              const x = points[index].x;
              const incomeHeight = item.income ? Math.max((item.income / scale.max) * geometry.chartHeight, 5) : 0;
              const expenseHeight = item.expense ? Math.max((item.expense / scale.max) * geometry.chartHeight, 5) : 0;
              return (
                <G key={`${item.key}-bars`}>
                  <Rect x={x - 13} y={geometry.bottom - incomeHeight} width="11" height={incomeHeight} rx="5" fill="#22c55e" />
                  <Rect x={x + 3} y={geometry.bottom - expenseHeight} width="11" height={expenseHeight} rx="5" fill="#7c3aed" />
                  {selectedItem?.key === item.key ? <Circle cx={x} cy={geometry.top - 3} r="4" fill={colors.ink} /> : null}
                </G>
              );
            })}
            <AxisLabels geometry={geometry} scale={scale} />
            <BottomLabels data={data} points={points} labelIndexes={labelIndexes} bottom={geometry.bottom} />
          </Svg>
          {points.map((point) => (
            <Pressable key={`${point.key}-bar-hit`} accessibilityLabel={`Show ${point.label}`} style={[styles.barHitTarget, { left: point.x - 20, top: geometry.top }]} onPress={() => onSelect?.(point)} />
          ))}
        </View>
      </ScrollView>
      <PointDetails point={selectedItem} />
    </View>
  );
}

function formatCompactCurrency(value) {
  if (!Number.isFinite(value)) return '0 đ';
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(abs % 1_000_000 === 0 ? 0 : 1)}M đ`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(abs % 1_000 === 0 ? 0 : 1)}k đ`;
  return `${value} đ`;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function buildFlowModel(totals, expenseRows, incomeRows) {
  const maxIncomeNodes = 3;
  const maxOutputNodes = 6;
  const sortedIncome = [...incomeRows].sort((a, b) => b.value - a.value);
  const sortedExpense = [...expenseRows].sort((a, b) => b.value - a.value);

  const incomePrimary = sortedIncome.slice(0, maxIncomeNodes).map((entry) => ({ name: entry.name, value: entry.value, fill: entry.color || '#38bdf8' }));
  const otherIncomeValue = sortedIncome.slice(maxIncomeNodes).reduce((sum, entry) => sum + entry.value, 0);
  if (otherIncomeValue > 0) {
    incomePrimary.push({ name: 'Other Income', value: otherIncomeValue, fill: '#38bdf8' });
  }

  const deficitValue = Math.max(totals.expense - totals.income, 0);
  if (deficitValue > 0) {
    incomePrimary.push({ name: 'Deficit Funding', value: deficitValue, fill: '#f59e0b' });
  }

  const outputs = [];
  if (totals.net > 0) {
    outputs.push({ name: 'Savings', value: totals.net, fill: '#16a34a' });
  }

  const expensePrimary = sortedExpense.slice(0, 4).map((entry) => ({ name: entry.name, value: entry.value, fill: entry.color }));
  const otherExpenseValue = sortedExpense.slice(4).reduce((sum, entry) => sum + entry.value, 0);
  expensePrimary.forEach((entry) => outputs.push(entry));
  if (otherExpenseValue > 0) {
    outputs.push({ name: 'Other Expenses', value: otherExpenseValue, fill: '#94a3b8' });
  }

  if (outputs.length > maxOutputNodes) {
    const savingsNode = outputs.find((item) => item.name === 'Savings');
    const expenseNodes = outputs.filter((item) => item.name !== 'Savings');
    const reservedSlots = maxOutputNodes - (savingsNode ? 1 : 0) - 1;
    const visibleExpenses = expenseNodes.slice(0, reservedSlots);
    const collapsedValue = expenseNodes.slice(reservedSlots).reduce((sum, item) => sum + item.value, 0);
    const collapsed = { name: 'Other Expenses', value: collapsedValue, fill: '#94a3b8' };
    const nextOutputs = [];
    if (savingsNode) nextOutputs.push(savingsNode);
    nextOutputs.push(...visibleExpenses);
    nextOutputs.push(collapsed);
    outputs.length = 0;
    outputs.push(...nextOutputs);
  }

  const incomeNodes = incomePrimary.map((entry) => ({ ...entry, fill: entry.fill || '#38bdf8' }));
  const outputNodes = outputs.map((entry) => ({ ...entry, fill: entry.fill || '#94a3b8' }));

  const links = [
    ...incomeNodes.map((entry) => ({ source: entry.name, target: 'Available Cash', value: entry.value, color: '#93c5fd' })),
    ...outputNodes.map((entry) => ({ source: 'Available Cash', target: entry.name, value: entry.value, color: entry.fill }))
  ];

  return { incomeNodes, outputNodes, links, availableValue: totals.income + deficitValue };
}

function layoutNodesIntoSlots(nodes, x, top, height, minHeight, maxHeight) {
  const availableHeight = Math.max(height, nodes.length * minHeight);
  const slotHeight = availableHeight / Math.max(nodes.length, 1);
  const maxValue = Math.max(...nodes.map((node) => node.value), 1);

  return nodes.map((node, index) => {
    const center = top + slotHeight * index + slotHeight / 2;
    const rawHeight = (node.value / maxValue) * slotHeight * 0.72;
    const heightValue = clamp(rawHeight, minHeight, maxHeight);
    const y = center - heightValue / 2;
    return { ...node, x, y, height: heightValue, center };
  });
}

function adjustLabelPositions(labels, minDistance, minY, maxY) {
  const sorted = [...labels].sort((a, b) => a.y - b.y);
  for (let index = 1; index < sorted.length; index += 1) {
    const previous = sorted[index - 1];
    const current = sorted[index];
    const delta = current.y - previous.y;
    if (delta < minDistance) {
      const shift = minDistance - delta;
      current.y = clamp(current.y + shift, minY, maxY);
    }
  }
  return sorted;
}

function flowBandPath(fromX, fromTopY, fromBottomY, toX, toTopY, toBottomY, curve) {
  return [
    `M${fromX},${fromTopY}`,
    `C${fromX + curve},${fromTopY} ${toX - curve},${toTopY} ${toX},${toTopY}`,
    `L${toX},${toBottomY}`,
    `C${toX - curve},${toBottomY} ${fromX + curve},${fromBottomY} ${fromX},${fromBottomY}`,
    "Z"
  ].join(" ");
}

function FlowDiagram({ totals, expenseRows, incomeRows }) {
  const chartWidth = 720;
  const chartHeight = 370;
  const leftX = 18;
  const hubX = 318;
  const rightX = 568;
  const nodeWidth = 14;
  const topPadding = 28;
  const bottomPadding = 28;
  const hubTop = topPadding + 8;
  const hubHeight = chartHeight - topPadding - bottomPadding - 16;
  const minNodeHeight = 14;
  const maxNodeHeight = 70;
  const minLinkThickness = 6;
  const maxLinkThickness = 80;
  const curveIncoming = 92;
  const curveOutgoing = 104;

  const flow = buildFlowModel(totals, expenseRows, incomeRows);
  const incomingLinks = flow.links.filter((link) => link.target === 'Available Cash');
  const outgoingLinks = flow.links.filter((link) => link.source === 'Available Cash');

  const incomeNodes = layoutNodesIntoSlots(flow.incomeNodes, leftX, topPadding, chartHeight - topPadding - bottomPadding, minNodeHeight, maxNodeHeight);
  const outputNodes = layoutNodesIntoSlots(flow.outputNodes, rightX, topPadding, chartHeight - topPadding - bottomPadding, minNodeHeight, maxNodeHeight);
  const nodeByName = new Map([...incomeNodes, ...outputNodes].map((node) => [node.name, node]));

  const hubInnerTop = hubTop + 12;
  const hubInnerBottom = hubTop + hubHeight - 12;
  const availableHubHeight = Math.max(hubInnerBottom - hubInnerTop, 40);

  function computeLinkThicknesses(links) {
    const totalValue = Math.max(links.reduce((sum, item) => sum + item.value, 0), 1);
    let thicknesses = links.map((item) => clamp((item.value / totalValue) * availableHubHeight, minLinkThickness, maxLinkThickness));
    const totalThickness = thicknesses.reduce((sum, value) => sum + value, 0);
    if (totalThickness > availableHubHeight) {
      const scale = availableHubHeight / totalThickness;
      thicknesses = thicknesses.map((t) => Math.max(minLinkThickness, t * scale));
    }
    return thicknesses;
  }

  const incomingThicknesses = computeLinkThicknesses(incomingLinks);
  const outgoingThicknesses = computeLinkThicknesses(outgoingLinks);

  let incomingCursor = hubInnerTop;
  let outgoingCursor = hubInnerTop;

  const incomeLabelX = leftX + nodeWidth + 12;
  const hubLabelX = hubX + nodeWidth + 22;
  const outputLabelX = rightX + nodeWidth + 12;

  const outputLabels = adjustLabelPositions(
    outputNodes.map((node) => ({ name: node.name, y: node.center })),
    38,
    topPadding + 12,
    chartHeight - bottomPadding - 12
  );
  const outputLabelYByName = new Map(outputLabels.map((label) => [label.name, label.y]));

  return (
    <>
      <Text style={styles.flowHint}>Swipe to view full cash flow</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.flowScroller} contentContainerStyle={[styles.flowScrollContent, { width: chartWidth }]}>
        <Svg width={chartWidth} height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
          <Rect x="0" y="0" width={chartWidth} height={chartHeight} rx="18" fill="#ecfeff" />

          {incomingLinks.map((link, index) => {
            const thickness = incomingThicknesses[index] || minLinkThickness;
            const top = incomingCursor;
            const bottom = top + thickness;
            incomingCursor = bottom;
            const fromNode = nodeByName.get(link.source) || { x: leftX, center: topPadding + 32 };
            return (
              <Path
                key={`incoming-${index}`}
                d={flowBandPath(
                  fromNode.x + nodeWidth,
                  fromNode.center - thickness / 2,
                  fromNode.center + thickness / 2,
                  hubX,
                  top,
                  bottom,
                  curveIncoming
                )}
                fill={link.source === "Deficit Funding" ? "#fbbf24" : link.color}
                fillOpacity="0.38"
              />
            );
          })}

          {outgoingLinks.map((link, index) => {
            const thickness = outgoingThicknesses[index] || minLinkThickness;
            const top = outgoingCursor;
            const bottom = top + thickness;
            outgoingCursor = bottom;
            const toNode = nodeByName.get(link.target) || { x: rightX, center: hubTop + hubHeight / 2 };
            return (
              <Path
                key={`outgoing-${index}`}
                d={flowBandPath(
                  hubX + nodeWidth,
                  top,
                  bottom,
                  toNode.x,
                  toNode.center - thickness / 2,
                  toNode.center + thickness / 2,
                  curveOutgoing
                )}
                fill={link.color}
                fillOpacity="0.42"
              />
            );
          })}

          {incomeNodes.map((node) => (
            <G key={`income-node-${node.name}`}>
              <Rect x={node.x} y={node.y} width={nodeWidth} height={node.height} rx="7" fill={node.fill} />
              <SvgText x={incomeLabelX} y={node.center - 4} fontSize="12" fontWeight="800" fill="#0f172a" textAnchor="start">
                {truncateLabel(node.name, 18)}
              </SvgText>
              <SvgText x={incomeLabelX} y={node.center + 12} fontSize="11" fill="#334155" textAnchor="start">
                {formatCompactCurrency(node.value)}
              </SvgText>
            </G>
          ))}

          <Rect x={hubX} y={hubTop} width={nodeWidth} height={hubHeight} rx="8" fill="#0f172a" />
          <SvgText x={hubLabelX} y={hubTop + hubHeight / 2 - 6} fontSize="12" fontWeight="900" fill="#0f172a" textAnchor="start">
            Available Cash
          </SvgText>
          <SvgText x={hubLabelX} y={hubTop + hubHeight / 2 + 10} fontSize="11" fill="#334155" textAnchor="start">
            {formatCompactCurrency(flow.availableValue)}
          </SvgText>

          {outputNodes.map((node) => (
            <G key={`output-node-${node.name}`}>
              <Rect x={node.x} y={node.y} width={nodeWidth} height={node.height} rx="7" fill={node.fill} />
              <SvgText x={outputLabelX} y={(outputLabelYByName.get(node.name) ?? node.center) - 4} fontSize="12" fontWeight="800" fill="#0f172a" textAnchor="start">
                {truncateLabel(node.name, 18)}
              </SvgText>
              <SvgText x={outputLabelX} y={(outputLabelYByName.get(node.name) ?? node.center) + 12} fontSize="11" fill="#334155" textAnchor="start">
                {formatCompactCurrency(node.value)}
              </SvgText>
            </G>
          ))}
        </Svg>
      </ScrollView>
    </>
  );
}

function TrendLine({ data, height = 230, width = 300, selected, onSelect }) {
  const contentWidth = getChartContentWidth(data.length, width);
  const geometry = getChartGeometry(contentWidth, height);
  const scale = getValueScale(data.map((item) => item.net), 4);
  const points = getSeriesPoints(data, geometry, scale, "net");
  const path = buildPolylinePath(points);
  const labelIndexes = getLabelIndexes(data.length);
  const selectedItem = selected || data[data.length - 1];

  return (
    <View>
      <ScrollView horizontal={contentWidth > width} showsHorizontalScrollIndicator={false} style={styles.chartScroller}>
        <View style={[styles.chartCanvas, { width: contentWidth, height }]}>
          <Svg width={contentWidth} height={height} viewBox={`0 0 ${contentWidth} ${height}`}>
            <ChartGrid geometry={geometry} scale={scale} />
            {path ? <Path d={path} stroke="#0f766e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" /> : null}
            {points.map((point) => (
              <Circle
                key={`${point.key}-trend-point`}
                cx={point.x}
                cy={point.y}
                r={selectedItem?.key === point.key ? 7 : 5}
                fill={point.net >= 0 ? colors.success : colors.rose}
                stroke={colors.surface}
                strokeWidth="2"
              />
            ))}
            <AxisLabels geometry={geometry} scale={scale} />
            <BottomLabels data={data} points={points} labelIndexes={labelIndexes} bottom={geometry.bottom} />
          </Svg>
          {points.map((point) => (
            <Pressable key={`${point.key}-trend-hit`} accessibilityLabel={`Show ${point.label}`} style={[styles.chartHitTarget, { left: point.x - 18, top: point.y - 18 }]} onPress={() => onSelect?.(point)} />
          ))}
        </View>
      </ScrollView>
      <PointDetails point={selectedItem} />
    </View>
  );
}

function getChartGeometry(width, height) {
  const left = 50;
  const right = 14;
  const top = 18;
  const bottom = height - 44;
  return {
    left,
    right,
    top,
    bottom,
    width,
    height,
    chartWidth: width - left - right,
    chartHeight: bottom - top
  };
}

function getChartContentWidth(pointCount, width) {
  if (pointCount <= 8) return width;
  return Math.max(width, pointCount * 44 + 58);
}

function getValueScale(values, paddingPercent = 0) {
  const finiteValues = values.filter(Number.isFinite);
  const rawMax = Math.max(...finiteValues, 0);
  const rawMin = Math.min(...finiteValues, 0);
  const span = Math.max(rawMax - rawMin, 1);
  const padding = span * (paddingPercent / 100);
  const max = rawMax + padding;
  const min = rawMin - padding;
  return { min, max, span: Math.max(max - min, 1) };
}

function getSeriesPoints(data, geometry, scale, key) {
  return data.map((item, index) => {
    const x = data.length === 1
      ? geometry.left + geometry.chartWidth / 2
      : geometry.left + (index / (data.length - 1)) * geometry.chartWidth;
    const y = geometry.top + ((scale.max - item[key]) / scale.span) * geometry.chartHeight;
    return { ...item, x, y };
  });
}

function buildPolylinePath(points) {
  if (!points.length) return "";
  return points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`).join(" ");
}

function getLabelIndexes(length) {
  if (length <= 1) return [0];
  if (length <= 4) return Array.from({ length }, (_, index) => index);
  if (length > 8) return [0];
  const middle = Math.floor((length - 1) / 2);
  return [0, middle];
}

function ChartGrid({ geometry, scale }) {
  const zeroY = geometry.top + ((scale.max - 0) / scale.span) * geometry.chartHeight;
  const clampedZeroY = clamp(zeroY, geometry.top, geometry.bottom);
  return (
    <G>
      <Rect x={geometry.left} y={geometry.top} width={geometry.chartWidth} height={geometry.chartHeight} rx="10" fill="#f8fafc" />
      {[0, 0.5, 1].map((ratio) => {
        const y = geometry.top + ratio * geometry.chartHeight;
        return <Line key={`grid-${ratio}`} x1={geometry.left} x2={geometry.width - geometry.right} y1={y} y2={y} stroke="#e2e8f0" strokeWidth="1" />;
      })}
      <Line x1={geometry.left} x2={geometry.width - geometry.right} y1={clampedZeroY} y2={clampedZeroY} stroke="#93c5fd" strokeWidth="1.5" strokeDasharray="4 4" />
      <Line x1={geometry.left} x2={geometry.left} y1={geometry.top} y2={geometry.bottom} stroke="#cbd5e1" strokeWidth="1.5" />
      <Line x1={geometry.left} x2={geometry.width - geometry.right} y1={geometry.bottom} y2={geometry.bottom} stroke="#cbd5e1" strokeWidth="1.5" />
    </G>
  );
}

function AxisLabels({ geometry, scale }) {
  const values = [scale.max, (scale.max + scale.min) / 2, scale.min];
  return (
    <G>
      {values.map((value, index) => {
        const y = index === 0 ? geometry.top + 4 : index === 1 ? geometry.top + geometry.chartHeight / 2 + 4 : geometry.bottom;
        return (
          <SvgText key={`axis-${index}`} x={geometry.left - 6} y={y} fontSize="10" fontWeight="800" fill="#64748b" textAnchor="end">
            {formatCompactCurrency(value)}
          </SvgText>
        );
      })}
    </G>
  );
}

function BottomLabels({ data, points, labelIndexes, bottom }) {
  return (
    <G>
      {labelIndexes.map((index) => {
        const point = points[index];
        const item = data[index];
        if (!point || !item) return null;
        const isFirst = index === 0;
        const isLast = index === data.length - 1;
        return (
          <SvgText
            key={`${item.key}-bottom-label`}
            x={point.x}
            y={bottom + 24}
            fontSize="10"
            fontWeight="800"
            fill="#64748b"
            textAnchor={isFirst ? "start" : isLast ? "end" : "middle"}
          >
            {shortDateLabel(item.label)}
          </SvgText>
        );
      })}
    </G>
  );
}

function ChartLegend() {
  return (
    <View style={styles.chartLegend}>
      <View style={styles.legendItem}>
        <View style={[styles.legendDot, { backgroundColor: "#22c55e" }]} />
        <Text style={styles.legendText}>Income</Text>
      </View>
      <View style={styles.legendItem}>
        <View style={[styles.legendDot, { backgroundColor: "#7c3aed" }]} />
        <Text style={styles.legendText}>Expenses</Text>
      </View>
      <View style={styles.legendItem}>
        <View style={[styles.legendDot, { backgroundColor: colors.rose }]} />
        <Text style={styles.legendText}>Net</Text>
      </View>
    </View>
  );
}

function PointDetails({ point }) {
  if (!point) return null;
  return (
    <View style={styles.pointDetails}>
      <View style={styles.pointHeader}>
        <Text style={styles.pointLabel}>{point.label}</Text>
        <Text style={[styles.pointNet, point.net >= 0 ? styles.income : styles.expense]}>{formatVND(point.net)}</Text>
      </View>
      <View style={styles.pointGrid}>
        <View style={styles.pointMetric}>
          <Text style={styles.pointMetricLabel}>Income</Text>
          <Text style={styles.pointMetricValue}>{formatCompactCurrency(point.income)}</Text>
        </View>
        <View style={styles.pointMetric}>
          <Text style={styles.pointMetricLabel}>Expense</Text>
          <Text style={styles.pointMetricValue}>{formatCompactCurrency(point.expense)}</Text>
        </View>
      </View>
    </View>
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

function NetTrend({ data, chartWidth }) {
  const [selected, setSelected] = useState(null);
  return <TrendLine data={data} height={218} width={chartWidth} selected={selected} onSelect={setSelected} />;
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

function shortDateLabel(label) {
  return String(label).replace(/, 202\d$/, "").replace(/ 202\d$/, "");
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
  statCard: { width: 148, minHeight: 82, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  statCopy: { flex: 1, minWidth: 0 },
  statLabel: { color: colors.muted, fontWeight: "800", fontSize: 10 },
  statValue: { color: colors.ink, fontSize: 16, fontWeight: "900", marginTop: 7 },
  statIcon: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center", flexShrink: 0 },
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
  chartScroller: { marginTop: 10, borderRadius: 14, backgroundColor: "#f8fafc" },
  chartCanvas: { position: "relative" },
  chartHitTarget: { position: "absolute", width: 36, height: 36, borderRadius: 18 },
  barHitTarget: { position: "absolute", width: 40, height: 160, borderRadius: 14 },
  chartLegend: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 14 },
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
  flowHint: { color: colors.muted, fontSize: 12, fontWeight: "800", marginTop: 12, marginBottom: 2, paddingLeft: 18 },
  flowScroller: { height: 370, marginTop: 8, borderRadius: 18, backgroundColor: "#ecfeff" },
  flowScrollContent: { width: 720 },
  lineChart: { width: 320, maxWidth: "100%", alignSelf: "center", marginTop: 18, borderLeftWidth: 1, borderBottomWidth: 1, borderColor: colors.border, position: "relative", overflow: "hidden" },
  zeroLine: { position: "absolute", left: 0, right: 0, height: 1, backgroundColor: "#dbeafe" },
  lineSegment: { position: "absolute", height: 2, borderRadius: 2, backgroundColor: "#0f766e" },
  linePoint: { position: "absolute", width: 8, height: 8, borderRadius: 4, borderWidth: 2, borderColor: colors.surface },
  lineLabels: { position: "absolute", left: 0, right: 0, bottom: 0, flexDirection: "row", justifyContent: "space-between" },
  pointDetails: { marginTop: 10, borderRadius: 12, borderWidth: 1, borderColor: "#ccfbf1", backgroundColor: "#f0fdfa", padding: 12 },
  pointHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  pointLabel: { color: colors.ink, fontWeight: "900", flex: 1 },
  pointNet: { fontWeight: "900", textAlign: "right" },
  pointGrid: { flexDirection: "row", gap: 8, marginTop: 10 },
  pointMetric: { flex: 1, borderRadius: 10, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: 10 },
  pointMetricLabel: { color: colors.muted, fontSize: 10, fontWeight: "900", textTransform: "uppercase" },
  pointMetricValue: { color: colors.ink, fontWeight: "900", marginTop: 4 },
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
