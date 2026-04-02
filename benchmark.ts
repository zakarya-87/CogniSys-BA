import { performance } from 'perf_hooks';

function generateData(size: number) {
    const nodes = [];
    for (let i = 0; i < size; i++) {
        nodes.push({ id: `node-${i}`, type: i % 10 === 0 ? 'Initiative' : 'Other' });
    }
    return { nodes };
}

function before(graphData: any) {
    const width = 800;
    const height = 600;
    const center = { x: width / 2, y: height / 2 };

    const initiatives = graphData.nodes.filter((n: any) => n.type === 'Initiative');
    const others = graphData.nodes.filter((n: any) => n.type !== 'Initiative');

    const nodesWithPos = graphData.nodes.map((n: any) => ({...n, x: center.x, y: center.y}));

    initiatives.forEach((n: any, i: number) => {
        const angle = (i / initiatives.length) * 2 * Math.PI;
        const radius = 150;
        const targetNode = nodesWithPos.find((x: any) => x.id === n.id);
        if (targetNode) {
            targetNode.x = center.x + radius * Math.cos(angle);
            targetNode.y = center.y + radius * Math.sin(angle);
        }
    });

    others.forEach((n: any, i: number) => {
        const angle = (i / others.length) * 2 * Math.PI;
        const radius = 280;
        const targetNode = nodesWithPos.find((x: any) => x.id === n.id);
        if (targetNode) {
            targetNode.x = center.x + radius * Math.cos(angle);
            targetNode.y = center.y + radius * Math.sin(angle);
        }
    });

    return nodesWithPos;
}

function after(graphData: any) {
    const width = 800;
    const height = 600;
    const center = { x: width / 2, y: height / 2 };

    const initiatives = graphData.nodes.filter((n: any) => n.type === 'Initiative');
    const others = graphData.nodes.filter((n: any) => n.type !== 'Initiative');

    const nodesWithPos = graphData.nodes.map((n: any) => ({...n, x: center.x, y: center.y}));
    const nodeMap = new Map(nodesWithPos.map(n => [n.id, n]));

    initiatives.forEach((n: any, i: number) => {
        const angle = (i / initiatives.length) * 2 * Math.PI;
        const radius = 150;
        const targetNode = nodeMap.get(n.id);
        if (targetNode) {
            targetNode.x = center.x + radius * Math.cos(angle);
            targetNode.y = center.y + radius * Math.sin(angle);
        }
    });

    others.forEach((n: any, i: number) => {
        const angle = (i / others.length) * 2 * Math.PI;
        const radius = 280;
        const targetNode = nodeMap.get(n.id);
        if (targetNode) {
            targetNode.x = center.x + radius * Math.cos(angle);
            targetNode.y = center.y + radius * Math.sin(angle);
        }
    });

    return nodesWithPos;
}

const data = generateData(10000);

const t0 = performance.now();
before(data);
const t1 = performance.now();
console.log(`Before: ${t1 - t0} ms`);

const t2 = performance.now();
after(data);
const t3 = performance.now();
console.log(`After: ${t3 - t2} ms`);
