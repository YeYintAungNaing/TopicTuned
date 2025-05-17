import Redis from 'ioredis';

export const redis = new Redis(); 

// async function testRedis() {
//   await redis.set('first', 'value');
//   const value = await redis.get('first');
//   console.log(value); 
// }

// testRedis();
