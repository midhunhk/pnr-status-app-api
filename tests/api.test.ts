import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

describe('PNR Status Web API Endpoints', () => {
  it('GET / should return Hello Universe!', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.text).toBe('Hello Universe!');
  });

  it('GET /usage should return endpoint usage guidance', async () => {
    const res = await request(app).get('/usage');
    expect(res.status).toBe(200);
    expect(res.text).toBe('GET /pnrstatus/{serviceId}/{pnrNumber}');
  });

  it('GET /health should return status UP', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('UP');
    expect(res.body.timestamp).toBeDefined();
  });

  it('GET /pnrstatus/2/6327949227 should return stubbed PNR status result', async () => {
    const res = await request(app).get('/pnrstatus/2/6327949227');
    expect(res.status).toBe(200);
    expect(res.body.version).toBe(1);
    expect(res.body.status).toBe('READY');
    expect(res.body.service).toBe('rail-yatri');
    expect(res.body.pnrNo).toBe('6327949227');
  });

  it('GET /pnrstatus/1/6327949227 should return error for disabled service', async () => {
    const res = await request(app).get('/pnrstatus/1/6327949227');
    expect(res.status).toBe(400);
    expect(res.body.status).toBe('ERROR');
    expect(res.body.message).toContain('Service id 1 is disabled');
  });

  it('GET /pnrstatus/999/6327949227 should return error for invalid service ID', async () => {
    const res = await request(app).get('/pnrstatus/999/6327949227');
    expect(res.status).toBe(400);
    expect(res.body.status).toBe('ERROR');
    expect(res.body.message).toContain('Service id 999 is invalid');
  });
});
