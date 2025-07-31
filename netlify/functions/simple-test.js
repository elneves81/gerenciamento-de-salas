exports.handler = async (event, context) => {
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: "Test function working!",
      env_check: {
        DATABASE_URL: process.env.DATABASE_URL ? "EXISTS" : "MISSING",
        JWT_SECRET: process.env.JWT_SECRET ? "EXISTS" : "MISSING"
      },
      timestamp: new Date().toISOString()
    })
  };
};
