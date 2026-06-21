// services/simpleBanditService.js - Alternative without math.js
import UserBandit from '../models/UserBandit.js';

const D = 10;

// Simple matrix multiplication for vectors (dot product)
const dotProduct = (a, b) => {
  return a.reduce((sum, val, i) => sum + val * b[i], 0);
};

// Simple matrix-vector multiplication
const matrixVectorMult = (matrix, vector) => {
  return matrix.map(row => dotProduct(row, vector));
};

// Simple matrix-matrix multiplication
const matrixMult = (a, b) => {
  const result = Array(a.length).fill().map(() => Array(b[0].length).fill(0));
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b[0].length; j++) {
      for (let k = 0; k < a[0].length; k++) {
        result[i][j] += a[i][k] * b[k][j];
      }
    }
  }
  return result;
};

// Simple matrix addition
const matrixAdd = (a, b) => {
  return a.map((row, i) => row.map((val, j) => val + b[i][j]));
};

// Simple vector addition
const vectorAdd = (a, b) => {
  return a.map((val, i) => val + b[i]);
};

// Simple outer product (x * x^T)
const outerProduct = (v) => {
  const result = Array(v.length).fill().map(() => Array(v.length).fill(0));
  for (let i = 0; i < v.length; i++) {
    for (let j = 0; j < v.length; j++) {
      result[i][j] = v[i] * v[j];
    }
  }
  return result;
};

// Simple matrix inversion for diagonal matrices (approximation)
// For a full implementation, you'd need a proper linear algebra library
// This is a placeholder - in production, use math.js or a dedicated library
const inverseMatrix = (matrix) => {
  // For simplicity, assume matrix is diagonal and invert element-wise
  // WARNING: This is not accurate for non-diagonal matrices!
  // For production, use math.inv from math.js
  return matrix.map((row, i) => 
    row.map((val, j) => i === j ? 1 / (val + 1e-8) : 0)
  );
};

export const initUserBandit = async (userId) => {
  console.log('Initializing bandit for user:', userId);
  const A = Array(D).fill().map(() => {
    const row = Array(D).fill(0);
    row.fill(0);
    return row;
  });
  // Set diagonal to 1
  for (let i = 0; i < D; i++) {
    A[i][i] = 1;
  }
  const b = new Array(D).fill(0);
  const bandit = new UserBandit({ userId, A, b, d: D });
  await bandit.save();
  return bandit;
};

export const computeUCBForFeatures = async (userId, featureVectors) => {
  let bandit = await UserBandit.findOne({ userId });
  if (!bandit) {
    bandit = await initUserBandit(userId);
  }

  // Approximate inverse (in production, use math.inv)
  const A_inv = inverseMatrix(bandit.A);
  
  // Compute theta = A_inv * b
  const theta = matrixVectorMult(A_inv, bandit.b);

  const results = [];
  for (const x of featureVectors) {
    // Payoff = x^T * theta
    const payoff = dotProduct(x, theta);
    
    // Variance = x^T * A_inv * x
    const xT_A_inv = matrixVectorMult(A_inv, x);
    const variance = dotProduct(xT_A_inv, x);
    
    const uncertainty = bandit.alpha * Math.sqrt(Math.abs(variance));
    const ucb = payoff + uncertainty;
    
    results.push({ ucb, payoff, uncertainty, features: x });
  }
  
  return results;
};

export const updateBanditWithFeatures = async (userId, featureVector, reward) => {
  const bandit = await UserBandit.findOne({ userId });
  if (!bandit) return;

  // A = A + x * x^T
  const xxt = outerProduct(featureVector);
  const A_new = matrixAdd(bandit.A, xxt);
  
  // b = b + reward * x
  const rewardX = featureVector.map(val => val * reward);
  const b_new = vectorAdd(bandit.b, rewardX);

  bandit.A = A_new;
  bandit.b = b_new;
  bandit.updatedAt = new Date();
  await bandit.save();
};