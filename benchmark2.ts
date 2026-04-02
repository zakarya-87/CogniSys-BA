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

    let initCount = 0;
    let otherCount = 0;
    for (let i = 0; i < graphData.nodes.length; i++) {
        if (graphData.nodes[i].type === 'Initiative') initCount++;
        else otherCount++;
    }

    let initIdx = 0;
    let otherIdx = 0;

    const nodesWithPos = graphData.nodes.map((n: any) => {
        const isInit = n.type === 'Initiative';
        const idx = isInit ? initIdx++ : otherIdx++;
        const total = isInit ? initCount : otherCount;
        const radius = isInit ? 150 : 280;
        const angle = (total > 0 ? (idx / total) * 2 * Math.PI : 0);
        return {
            ...n,
            x: center.x + radius * Math.cos(angle),
            y: center.y + radius * Math.sin(angle)
        };
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
