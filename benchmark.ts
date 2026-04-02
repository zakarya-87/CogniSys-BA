import { performance } from 'perf_hooks';

// Simulate getting initiatives
const mockInitiatives = Array.from({ length: 1000 }, (_, i) => ({
  id: `init_${i}`,
  orgId: 'org_1',
  title: `Initiative ${i}`,
  wbs: []
}));

// Simulate fetching all from a generic API / Database (O(N) data transfer/memory)
async function getByOrgMock(orgId: string) {
  // Simulate network/db delay
  await new Promise(r => setTimeout(r, 10));
  return mockInitiatives.filter(i => i.orgId === orgId);
}

// Simulate fetching single by ID (O(1) data transfer/memory)
async function getByIdMock(id: string) {
  await new Promise(r => setTimeout(r, 10));
  return mockInitiatives.find(i => i.id === id) || null;
}

async function runBenchmark() {
  const targetId = 'init_999';
  const orgId = 'org_1';

  console.log('--- Before Optimization ---');
  let start = performance.now();
  let startMem = process.memoryUsage().heapUsed;

  const allInit = await getByOrgMock(orgId);
  const found = allInit.find(i => i.id === targetId);

  let end = performance.now();
  let endMem = process.memoryUsage().heapUsed;
  console.log(`Time: ${(end - start).toFixed(2)}ms`);
  console.log(`Memory used: ${endMem - startMem} bytes\n`);


  console.log('--- After Optimization ---');
  start = performance.now();
  startMem = process.memoryUsage().heapUsed;

  const single = await getByIdMock(targetId);
  const isValid = single && single.orgId === orgId;

  end = performance.now();
  endMem = process.memoryUsage().heapUsed;
  console.log(`Time: ${(end - start).toFixed(2)}ms`);
  console.log(`Memory used: ${endMem - startMem} bytes\n`);
}

runBenchmark();
