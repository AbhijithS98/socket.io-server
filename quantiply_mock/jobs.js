export const testJobs = [
  {
    client: "clientA123",
    endpoint: "https://dummyjson.com/todos/2",
    method: "GET",
    headers: {
    "Accept": "application/json" 
    },
    payload: null 
  },

  {
    client: "clientA",
    endpoint: "https://dummyjson.com/todos/add",
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    payload: {
      todo: "Finish Redis Pub/Sub testing",
      completed: false,
      userId: 5
    }
  },

    // PUT example
  {
    client: "clientA",
    endpoint: "https://dummyjson.com/todos/1",
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    payload: {
      todo: "Updated todo item",
      completed: true
    }
  },

  // PATCH example
  {
    client: "clientA",
    endpoint: "https://dummyjson.com/todos/1",
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    payload: {
      completed: true
    }
  },

  // DELETE example
  {
    client: "clientA",
    endpoint: "https://dummyjson.com/todos/1",
    method: "DELETE",
    headers: {
      "Content-Type": "application/json"
    },
    payload: {}
  },

  {
    client: "clientA",
    endpoint: "https://api.kite.trade/instruments",
    method: "GET",
    headers: {
      "Accept": "text/csv",
    },
    payload: null
  },

  {
    client: "clientA",
    endpoint: "https://assets.upstox.com/market-quote/instruments/exchange/complete.csv.gz",
    method: "GET",
    headers: {
      "Accept": "application/gzip",
    },
    payload: null
  },

]


