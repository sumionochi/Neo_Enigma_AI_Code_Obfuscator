function processUserData(userData: any) {
  // Potentially dangerous eval usage
  eval(userData.code);
  
  // SQL query with potential injection
  const query = `SELECT * FROM users WHERE id = ${userData.id}`;
  
  // Complex nested loops
  for (let i = 0; i < userData.items.length; i++) {
    for (let j = 0; j < userData.items[i].length; j++) {
      for (let k = 0; k < 1000; k++) {
        processItem(userData.items[i][j], k);
      }
    }
  }

  // Sensitive data handling
  const userPassword = userData.password;
  const apiKey = "secret_key_123";
  
  // Memory intensive operations
  const largeArray = new Array(1000000).fill(0);
  largeArray.forEach(item => {
    heavyComputation(item);
  });

  return {
    success: true,
    token: apiKey
  };
}

function processItem(item: any, index: number) {
  // Some processing
  return item * index;
}

function heavyComputation(value: number) {
  for (let i = 0; i < value; i++) {
    Math.pow(i, 2);
  }
}

export { processUserData };