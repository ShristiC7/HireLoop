## v1 Requirements

### Job Portal (JOB)
- [ ] **JOB-01**: Available jobs list loads correctly without API errors or blank states
- [ ] **JOB-02**: Users can successfully view individual job details and apply
- [ ] **JOB-03**: Resolving Express route ordering conflicts affecting job endpoints

### Mock Interview (MOCK)
- [ ] **MOCK-01**: AI mock interview frontend correctly updates state when AI responds
- [ ] **MOCK-02**: Backend properly communicates with Anthropic/OpenAI without dropping payload format
- [ ] **MOCK-03**: Interview completion flow accurately scores or ends the session without crashing

### Rate Limits (RATE)
- [ ] **RATE-01**: AI endpoints configure adequate rate-limit windows to support normal interview flow
- [ ] **RATE-02**: Global API rate limit is balanced to not block frontend hydration calls
- [ ] **RATE-03**: "Too many requests" errors gracefully notify the user instead of generic crashes

### User Profile (USER)
- [ ] **USER-01**: User profile endpoint retrieves the entire user object including relations (experience, education, resume)
- [ ] **USER-02**: Frontend properly renders all segments of the user profile without partial loading errors

## v2 Requirements (Deferred)
- (None deferred currently. All focus is on stabilization)

## Out of Scope
- Building new AI capabilities
- Adding new payment gateways or premium tiers
- Complete UI redesigns

## Traceability
*(To be populated by Roadmap)*
