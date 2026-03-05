/**
 * @file Rendu de diagrammes (barres et camembert) via Canvas 2D.
 * Utilisé pour l'export de documents (DOCX, ODT, PDF).
 * Reproduit le style visuel de H5P.Chart (mêmes couleurs par défaut).
 */

// Couleurs par défaut identiques au H5P.Chart (d3.scale.ordinal)
const DEFAULT_COLORS = [
    "#90EE90", "#ADD8E6", "#FFB6C1", "#B0C4DE",
    "#D3D3D3", "#20B2AA", "#FAFAD2"
];

const CHART_WIDTH = 800;
const CHART_HEIGHT = 500;
const BAR_PADDING = { top: 50, right: 30, bottom: 90, left: 70 };
const PIE_RADIUS_RATIO = 0.35;

/**
 * Génère une image PNG d'un diagramme à partir des données H5P Chart.
 * @param {Object} data - { graphMode, listOfTypes, figureDefinition }
 * @returns {{ dataURL: string, width: number, height: number } | null}
 */
export function generateChartImage(data) {
    if (!data || !data.listOfTypes || !data.listOfTypes.length) {
        return null;
    }

    const canvas = document.createElement('canvas');
    canvas.width = CHART_WIDTH;
    canvas.height = CHART_HEIGHT;
    const ctx = canvas.getContext('2d');

    // Fond blanc
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, CHART_WIDTH, CHART_HEIGHT);

    if (data.graphMode === 'pieChart') {
        drawPieChart(ctx, data);
    } else {
        drawBarChart(ctx, data);
    }

    // Titre
    if (data.figureDefinition) {
        ctx.fillStyle = '#333333';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(data.figureDefinition, CHART_WIDTH / 2, 10, CHART_WIDTH - 40);
    }

    return {
        dataURL: canvas.toDataURL('image/png'),
        width: canvas.width,
        height: canvas.height
    };
}

// =======================================================================
// BAR CHART
// =======================================================================

function drawBarChart(ctx, data) {
    const items = data.listOfTypes;
    const maxValue = Math.max(...items.map(d => d.value));
    if (maxValue === 0) return;

    const chartX = BAR_PADDING.left;
    const chartY = BAR_PADDING.top;
    const chartWidth = CHART_WIDTH - BAR_PADDING.left - BAR_PADDING.right;
    const chartHeight = CHART_HEIGHT - BAR_PADDING.top - BAR_PADDING.bottom;

    const totalBarWidth = chartWidth / items.length;
    const barWidth = totalBarWidth * 0.75;
    const barGap = totalBarWidth * 0.25;

    // Axe Y : graduation
    ctx.strokeStyle = '#999999';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#666666';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    const tickCount = 5;
    for (let i = 0; i <= tickCount; i++) {
        const val = Math.round((maxValue / tickCount) * i);
        const y = chartY + chartHeight - (val / maxValue) * chartHeight;

        // Ligne de grille
        ctx.beginPath();
        ctx.setLineDash([3, 3]);
        ctx.moveTo(chartX, y);
        ctx.lineTo(chartX + chartWidth, y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Valeur
        ctx.fillText(String(val), chartX - 8, y);
    }

    // Axes
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(chartX, chartY);
    ctx.lineTo(chartX, chartY + chartHeight);
    ctx.lineTo(chartX + chartWidth, chartY + chartHeight);
    ctx.stroke();

    // Barres
    items.forEach((item, i) => {
        const barHeight = (item.value / maxValue) * chartHeight;
        const x = chartX + i * totalBarWidth + barGap / 2;
        const y = chartY + chartHeight - barHeight;

        const color = item.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length];

        // Remplissage barre
        ctx.fillStyle = color;
        ctx.fillRect(x, y, barWidth, barHeight);

        // Bordure barre
        ctx.strokeStyle = darkenColor(color, 0.2);
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, barWidth, barHeight);

        // Valeur au-dessus de la barre
        ctx.fillStyle = '#333333';
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(String(item.value), x + barWidth / 2, y - 4);

        // Label sous l'axe X
        ctx.fillStyle = '#333333';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        wrapText(ctx, item.text, x + barWidth / 2, chartY + chartHeight + 8, totalBarWidth - 4, 15);
    });
}

// =======================================================================
// PIE CHART
// =======================================================================

function drawPieChart(ctx, data) {
    const items = data.listOfTypes;
    const total = items.reduce((sum, d) => sum + d.value, 0);
    if (total === 0) return;

    const centerX = CHART_WIDTH / 2;
    const centerY = CHART_HEIGHT / 2 + 15;
    const radius = Math.min(CHART_WIDTH, CHART_HEIGHT) * PIE_RADIUS_RATIO;

    let startAngle = -Math.PI / 2;

    // Dessiner les tranches
    items.forEach((item, i) => {
        const sliceAngle = (item.value / total) * 2 * Math.PI;
        const endAngle = startAngle + sliceAngle;
        const color = item.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length];

        // Tranche
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Label au centroïde
        const midAngle = startAngle + sliceAngle / 2;
        const pct = (item.value / total * 100);

        // Labels internes pour les grosses tranches, externes pour les petites
        if (pct >= 8) {
            const labelRadius = radius * 0.6;
            const labelX = centerX + Math.cos(midAngle) * labelRadius;
            const labelY = centerY + Math.sin(midAngle) * labelRadius;

            ctx.fillStyle = item.fontColor || '#000000';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(String(item.value), labelX, labelY);
        }

        startAngle = endAngle;
    });

    // Légende à droite
    const legendX = centerX + radius + 30;
    const legendY = BAR_PADDING.top + 10;
    const legendItemHeight = 24;

    items.forEach((item, i) => {
        const y = legendY + i * legendItemHeight;
        const color = item.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length];

        // Carré de couleur
        ctx.fillStyle = color;
        ctx.fillRect(legendX, y, 14, 14);
        ctx.strokeStyle = darkenColor(color, 0.2);
        ctx.lineWidth = 1;
        ctx.strokeRect(legendX, y, 14, 14);

        // Texte
        ctx.fillStyle = '#333333';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        const pct = (item.value / total * 100).toFixed(1);
        ctx.fillText(`${item.text} : ${item.value} (${pct}%)`, legendX + 20, y + 7);
    });
}

// =======================================================================
// UTILITAIRES
// =======================================================================

/**
 * Découpe un texte en plusieurs lignes si trop long.
 */
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let currentY = y;

    for (const word of words) {
        const testLine = line + (line ? ' ' : '') + word;
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && line) {
            ctx.fillText(line, x, currentY);
            line = word;
            currentY += lineHeight;
        } else {
            line = testLine;
        }
    }
    if (line) {
        ctx.fillText(line, x, currentY);
    }
}

/**
 * Assombrit une couleur hex d'un pourcentage donné.
 * @param {string} hex - Couleur hex (#RRGGBB)
 * @param {number} amount - Pourcentage d'assombrissement (0-1)
 * @returns {string} Couleur hex assombrie
 */
function darkenColor(hex, amount) {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, Math.floor((num >> 16) * (1 - amount)));
    const g = Math.max(0, Math.floor(((num >> 8) & 0xFF) * (1 - amount)));
    const b = Math.max(0, Math.floor((num & 0xFF) * (1 - amount)));
    return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
}
