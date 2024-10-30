import ELK, { ElkExtendedEdge, ElkNode } from 'elkjs';

import Ast from '../chevrotain/ast';
import CONSTS from '../consts';

const getTextSize = (text: string) => {
  const lines = text.split('\n');
  const width =
    CONSTS.CHARACTER_WIDTH * Math.max(...lines.map((line) => line.length));
  const height = CONSTS.LINE_HEIGHT * lines.length;
  return { width, height };
};

export const layout = async (ast: Ast, debug = false): Promise<ElkNode> => {
  let [vPadding, hPadding] = (ast.props.nodePadding ?? '16 32')
    .split(/\s+/)
    .map((i) => parseInt(i))
    .map((i) => (isNaN(i) ? 0 : i));
  vPadding = Math.max(vPadding ?? 0, 0);
  hPadding = hPadding ?? vPadding;
  hPadding = Math.max(hPadding, 0);
  const addPadding = (size: { width: number; height: number }, scale = 1) => ({
    width: size.width + hPadding * 2 * scale,
    height: size.height + vPadding * 2 * scale,
  });
  const elk = new ELK();
  if (debug) {
    console.log(JSON.stringify(ast, null, 2));
    const temp = elk.layout.bind(elk);
    elk.layout = async (graph, options) => {
      console.log(JSON.stringify({ graph, options }, null, 2));
      const result = await temp(graph, options);
      console.log(JSON.stringify(result, null, 2));
      return result;
    };
  }
  let direction = ast.props.direction?.toUpperCase();
  if (!['UP', 'DOWN', 'LEFT', 'RIGHT'].includes(direction)) {
    direction = 'RIGHT';
  }
  let routingStyle = ast.props.routingStyle?.toUpperCase();
  if (!['ORTHOGONAL', 'POLYLINE', 'SPLINES'].includes(routingStyle)) {
    routingStyle = 'ORTHOGONAL';
  }
  let spacing = parseInt(ast.props.spacing ?? '64');
  if (isNaN(spacing)) {
    spacing = 64;
  }
  spacing = Math.max(spacing, 16);
  const elkNode = await elk.layout(
    {
      id: 'root',
      children: ast.nodes.map((n, idx) => {
        const label = n.props.label || n.id;
        const regularShaped = ['circle', 'diamond'].includes(n.props.shape); // width === height
        let { width, height } = addPadding(getTextSize(label));
        if (regularShaped) {
          width = height = Math.max(width, height);
        }
        const r: ElkNode = {
          id: n.id,
          width,
          height,
          labels: [{ text: label }],
          ports: [
            {
              id: `${n.id}_u`,
              x: width / 2,
              y: 0,
            },
            {
              id: `${n.id}_r`,
              x: width,
              y: height / 2,
            },
            {
              id: `${n.id}_d`,
              x: width / 2,
              y: height,
            },
            {
              id: `${n.id}_l`,
              x: 0,
              y: height / 2,
            },
          ],
          properties: {
            portConstraints: 'FIXED_POS',
            partition: idx > 0 ? 1 : 0, // first node always first
          },
        };
        return r;
      }),
      edges: ast.links.map((e) => {
        let sourcePort = '';
        let targetPort = '';
        switch (direction) {
          case 'DOWN': {
            sourcePort = `${e.from}_d`;
            targetPort = `${e.to}_u`;
            break;
          }
          case 'UP': {
            sourcePort = `${e.from}_u`;
            targetPort = `${e.to}_d`;
            break;
          }
          case 'LEFT': {
            sourcePort = `${e.from}_l`;
            targetPort = `${e.to}_r`;
            break;
          }
          case 'RIGHT': {
            sourcePort = `${e.from}_r`;
            targetPort = `${e.to}_l`;
            break;
          }
        }
        const r: ElkExtendedEdge = {
          id: e.id,
          sources: [sourcePort],
          targets: [targetPort],
        };
        if (e.props.label) {
          r.labels = [
            {
              id: `${e.id}_label`,
              text: e.props.label,
              ...getTextSize(e.props.label),
            },
          ];
        }
        return r;
      }),
    },
    {
      layoutOptions: {
        'elk.algorithm': 'layered',
        'elk.direction': direction,
        'elk.edgeRouting': routingStyle,
        'elk.layered.spacing.baseValue': String(spacing),
        'elk.edgeLabels.inline': 'true', // show edge label right on the edge
        'elk.layered.crossingMinimization.forceNodeModelOrder': 'true',
        'elk.partitioning.activate': 'true',
      },
    },
  );
  return elkNode;
};
