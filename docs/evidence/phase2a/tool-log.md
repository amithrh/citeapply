# Phase 2A — verbatim WebMCP tool log (real Chrome 152.0.7977.66)

Captured by `tests/e2e/webmcp-journey.spec.ts` against the standalone production
build on http://localhost:3100.


## supported packet

**get_application_state**

request

```json
{"mode":"redacted"}
```

response

```json
{"ok":true,"data":{"access":"consent_required","safeActions":["use_visible_application"]}}
```

**get_application_state**

request

```json
{"mode":"protected"}
```

response

```json
{"ok":false,"error":{"code":"consent_required","message":"Use the visible CiteApply application to continue.","safeActions":["use_visible_application"]}}
```

**get_form_requirements**

request

```json
{"mode":"active"}
```

response

```json
{"ok":false,"error":{"code":"consent_required","message":"Use the visible CiteApply application to continue.","safeActions":["use_visible_application"]}}
```

**get_evidence_index**

request

```json
{}
```

response

```json
{"ok":false,"error":{"code":"consent_required","message":"Use the visible CiteApply application to continue.","safeActions":["use_visible_application"]}}
```

**get_validation_issues**

request

```json
{}
```

response

```json
{"ok":false,"error":{"code":"consent_required","message":"Use the visible CiteApply application to continue.","safeActions":["use_visible_application"]}}
```

**get_application_state**

request

```json
{"mode":"protected"}
```

response

```json
{"ok":true,"data":{"applicationRevision":2,"requirementsVersion":1,"stage":"draft","assistance":"allowed","activeFieldCount":6,"readyFieldCount":0,"blockerCount":6,"fields":[{"field":"legal_name","status":"missing"},{"field":"student_id","status":"missing"},{"field":"institution","status":"missing"},{"field":"preferred_contact_email","status":"missing"},{"field":"dependency","status":"missing"},{"field":"annual_household_income","status":"missing"}],"safeActions":["use_visible_application"]}}
```

**get_form_requirements**

request

```json
{"mode":"active"}
```

response

```json
{"ok":true,"data":{"applicationRevision":2,"requirementsVersion":1,"fields":[{"field":"legal_name","label":"Legal name","policy":"evidence","acceptedDocumentClasses":["synthetic_enrollment_record"],"active":true},{"field":"student_id","label":"Student ID","policy":"evidence","acceptedDocumentClasses":["synthetic_enrollment_record"],"active":true},{"field":"institution","label":"Institution","policy":"evidence","acceptedDocumentClasses":["synthetic_enrollment_record"],"active":true},{"field":"preferred_contact_email","label":"Preferred contact email","policy":"applicant_declared_test_email","acceptedDocumentClasses":[],"active":true},{"field":"dependency","label":"Dependency status","policy":"evidence","acceptedDocumentClasses":["synthetic_household_statement"],"active":true},{"field":"annual_household_income","label":"Annual household income","policy":"income_policy","acceptedDocumentClasses":["synthetic_household_statement","synthetic_income_statement"],"active":true}]}}
```

**get_evidence_index**

request

```json
{}
```

response

```json
{"ok":true,"data":{"documents":[{"code":"enrollment","title":"Synthetic Enrollment Record","documentClass":"synthetic_enrollment_record"},{"code":"household","title":"Synthetic Household Statement","documentClass":"synthetic_household_statement"},{"code":"income","title":"Synthetic Income Statement","documentClass":"synthetic_income_statement"}],"claims":[{"claimHandle":"A6qfwFBMfSMzCpzyRnKY6w","page":1,"document":"enrollment","kind":"legal_name","normalizedValue":"Anaya Rao"},{"claimHandle":"ai71MCbfcL9Fv1FDuC839A","page":1,"document":"enrollment","kind":"student_id","normalizedValue":"HZN-2026-0142"},{"claimHandle":"Bg69aYe9_pQj9fOhudgm8Q","page":1,"document":"enrollment","kind":"institution","normalizedValue":"Northstar Community College"},{"claimHandle":"eFs0S9KVSfAM9AiufFOTug","page":1,"document":"household","kind":"dependency","normalizedValue":true},{"claimHandle":"Zpwx10ECu53N8IgNG2yEiA","page":1,"document":"household","kind":"guardian_name","normalizedValue":"Meera Rao"},{"claimHandle":"LiJBGSzM91RWqdUQm8P8Uw","page":1,"document":"household","kind":"household_size","normalizedValue":4},{"claimHandle":"yuNBkFUh1czWgP-jSjk1Vw","page":1,"document":"household","kind":"annual_household_income","normalizedValue":480000},{"claimHandle":"W-mTHU28WHf-9uZ6IInYAg","page":1,"document":"income","kind":"annual_household_income","normalizedValue":480000}]}}
```

**apply_evidence_backed_answers**

request

```json
{"requestId":"14c209a1-caf8-4f2b-aef4-ea54d7733357","expectedApplicationRevision":2,"expectedRequirementsVersion":1,"changes":[{"kind":"bind_claim","field":"legal_name","claimHandle":"A6qfwFBMfSMzCpzyRnKY6w"},{"kind":"bind_claim","field":"student_id","claimHandle":"ai71MCbfcL9Fv1FDuC839A"},{"kind":"bind_claim","field":"institution","claimHandle":"Bg69aYe9_pQj9fOhudgm8Q"},{"kind":"bind_claim","field":"dependency","claimHandle":"eFs0S9KVSfAM9AiufFOTug"}]}
```

response

```json
{"ok":true,"data":{"applicationRevision":3,"requirementsVersion":2,"updatedFields":["legal_name","student_id","institution","dependency"],"rereadRequirements":true}}
```

**get_application_state**

request

```json
{"mode":"protected"}
```

response

```json
{"ok":true,"data":{"applicationRevision":3,"requirementsVersion":2,"stage":"draft","assistance":"allowed","activeFieldCount":8,"readyFieldCount":4,"blockerCount":4,"fields":[{"field":"legal_name","status":"ready","value":"Anaya Rao"},{"field":"student_id","status":"ready","value":"HZN-2026-0142"},{"field":"institution","status":"ready","value":"Northstar Community College"},{"field":"preferred_contact_email","status":"missing"},{"field":"dependency","status":"ready","value":true},{"field":"guardian_name","status":"missing"},{"field":"household_size","status":"missing"},{"field":"annual_household_income","status":"missing"}],"safeActions":["use_visible_application"]}}
```

**get_form_requirements**

request

```json
{"mode":"active"}
```

response

```json
{"ok":true,"data":{"applicationRevision":3,"requirementsVersion":2,"fields":[{"field":"legal_name","label":"Legal name","policy":"evidence","acceptedDocumentClasses":["synthetic_enrollment_record"],"active":true},{"field":"student_id","label":"Student ID","policy":"evidence","acceptedDocumentClasses":["synthetic_enrollment_record"],"active":true},{"field":"institution","label":"Institution","policy":"evidence","acceptedDocumentClasses":["synthetic_enrollment_record"],"active":true},{"field":"preferred_contact_email","label":"Preferred contact email","policy":"applicant_declared_test_email","acceptedDocumentClasses":[],"active":true},{"field":"dependency","label":"Dependency status","policy":"evidence","acceptedDocumentClasses":["synthetic_household_statement"],"active":true},{"field":"guardian_name","label":"Guardian name","policy":"evidence","acceptedDocumentClasses":["synthetic_household_statement"],"condition":{"field":"dependency","equals":true},"active":true},{"field":"household_size","label":"Household size","policy":"evidence","acceptedDocumentClasses":["synthetic_household_statement"],"condition":{"field":"dependency","equals":true},"active":true},{"field":"annual_household_income","label":"Annual household income","policy":"income_policy","acceptedDocumentClasses":["synthetic_household_statement","synthetic_income_statement"],"active":true}]}}
```

**apply_evidence_backed_answers**

request

```json
{"requestId":"30a77d44-aba5-4b4d-859f-308fa98b66b5","expectedApplicationRevision":3,"expectedRequirementsVersion":2,"changes":[{"kind":"bind_claim","field":"guardian_name","claimHandle":"Zpwx10ECu53N8IgNG2yEiA"},{"kind":"bind_claim","field":"household_size","claimHandle":"LiJBGSzM91RWqdUQm8P8Uw"}]}
```

response

```json
{"ok":true,"data":{"applicationRevision":4,"requirementsVersion":2,"updatedFields":["guardian_name","household_size"],"rereadRequirements":false}}
```

**get_application_state**

request

```json
{"mode":"protected"}
```

response

```json
{"ok":true,"data":{"applicationRevision":4,"requirementsVersion":2,"stage":"draft","assistance":"allowed","activeFieldCount":8,"readyFieldCount":6,"blockerCount":2,"fields":[{"field":"legal_name","status":"ready","value":"Anaya Rao"},{"field":"student_id","status":"ready","value":"HZN-2026-0142"},{"field":"institution","status":"ready","value":"Northstar Community College"},{"field":"preferred_contact_email","status":"missing"},{"field":"dependency","status":"ready","value":true},{"field":"guardian_name","status":"ready","value":"Meera Rao"},{"field":"household_size","status":"ready","value":4},{"field":"annual_household_income","status":"missing"}],"safeActions":["use_visible_application"]}}
```

**apply_evidence_backed_answers**

request

```json
{"requestId":"e40ad38a-ef4e-4bc7-9787-81230d871ec9","expectedApplicationRevision":4,"expectedRequirementsVersion":2,"changes":[{"kind":"bind_claim","field":"annual_household_income","claimHandle":"W-mTHU28WHf-9uZ6IInYAg"}]}
```

response

```json
{"ok":true,"data":{"applicationRevision":5,"requirementsVersion":2,"updatedFields":["annual_household_income"],"rereadRequirements":false}}
```

**get_application_state**

request

```json
{"mode":"protected"}
```

response

```json
{"ok":true,"data":{"applicationRevision":5,"requirementsVersion":2,"stage":"draft","assistance":"allowed","activeFieldCount":8,"readyFieldCount":7,"blockerCount":1,"fields":[{"field":"legal_name","status":"ready","value":"Anaya Rao"},{"field":"student_id","status":"ready","value":"HZN-2026-0142"},{"field":"institution","status":"ready","value":"Northstar Community College"},{"field":"preferred_contact_email","status":"missing"},{"field":"dependency","status":"ready","value":true},{"field":"guardian_name","status":"ready","value":"Meera Rao"},{"field":"household_size","status":"ready","value":4},{"field":"annual_household_income","status":"ready","resolution":"source_supported","value":480000}],"safeActions":["use_visible_application"]}}
```

**apply_evidence_backed_answers**

request

```json
{"requestId":"e52993ca-1e27-4d56-bd43-03297fe7d69a","expectedApplicationRevision":5,"expectedRequirementsVersion":2,"changes":[{"kind":"propose_email","field":"preferred_contact_email","value":"anaya.rao@example.test"}]}
```

response

```json
{"ok":true,"data":{"applicationRevision":6,"requirementsVersion":2,"updatedFields":["preferred_contact_email"],"rereadRequirements":false}}
```

**get_application_state**

request

```json
{"mode":"protected"}
```

response

```json
{"ok":true,"data":{"applicationRevision":6,"requirementsVersion":2,"stage":"draft","assistance":"allowed","activeFieldCount":8,"readyFieldCount":7,"blockerCount":1,"fields":[{"field":"legal_name","status":"ready","value":"Anaya Rao"},{"field":"student_id","status":"ready","value":"HZN-2026-0142"},{"field":"institution","status":"ready","value":"Northstar Community College"},{"field":"preferred_contact_email","status":"needs_declaration","value":"anaya.rao@example.test"},{"field":"dependency","status":"ready","value":true},{"field":"guardian_name","status":"ready","value":"Meera Rao"},{"field":"household_size","status":"ready","value":4},{"field":"annual_household_income","status":"ready","resolution":"source_supported","value":480000}],"safeActions":["use_visible_application"]}}
```

**prepare_submission_review**

request

```json
{"requestId":"bb2260b3-b1f0-49ca-ac73-9f557603ad18","expectedApplicationRevision":6,"expectedRequirementsVersion":2}
```

response

```json
{"ok":false,"error":{"code":"not_ready_for_review","message":"The application is not ready for Review.","safeActions":["use_visible_application"],"blockers":[{"code":"declaration_required","field":"preferred_contact_email","message":"Declare the saved synthetic email in CiteApply.","action":"use_visible_application"}]}}
```

**get_application_state**

request

```json
{"mode":"protected"}
```

response

```json
{"ok":true,"data":{"applicationRevision":7,"requirementsVersion":2,"stage":"draft","assistance":"allowed","activeFieldCount":8,"readyFieldCount":8,"blockerCount":0,"fields":[{"field":"legal_name","status":"ready","value":"Anaya Rao"},{"field":"student_id","status":"ready","value":"HZN-2026-0142"},{"field":"institution","status":"ready","value":"Northstar Community College"},{"field":"preferred_contact_email","status":"ready","value":"anaya.rao@example.test","humanActionComplete":true},{"field":"dependency","status":"ready","value":true},{"field":"guardian_name","status":"ready","value":"Meera Rao"},{"field":"household_size","status":"ready","value":4},{"field":"annual_household_income","status":"ready","resolution":"source_supported","value":480000}],"safeActions":["use_visible_application"]}}
```

**prepare_submission_review**

request

```json
{"requestId":"f998c63f-1fff-4ba4-8d57-6925275b2b19","expectedApplicationRevision":7,"expectedRequirementsVersion":2}
```

response

```json
{"ok":true,"data":{"applicationRevision":8,"requirementsVersion":2,"readiness":"ready","reviewRef":"CDQLuLqj0yNKISxeaRCTMN"}}
```

**get_application_state**

request

```json
{"mode":"protected"}
```

response

```json
{"ok":false,"error":{"code":"consent_required","message":"Use the visible CiteApply application to continue.","safeActions":["use_visible_application"]}}
```


## conflict packet

**get_application_state**

request

```json
{"mode":"redacted"}
```

response

```json
{"ok":true,"data":{"access":"consent_required","safeActions":["use_visible_application"]}}
```

**get_application_state**

request

```json
{"mode":"protected"}
```

response

```json
{"ok":false,"error":{"code":"consent_required","message":"Use the visible CiteApply application to continue.","safeActions":["use_visible_application"]}}
```

**get_form_requirements**

request

```json
{"mode":"active"}
```

response

```json
{"ok":false,"error":{"code":"consent_required","message":"Use the visible CiteApply application to continue.","safeActions":["use_visible_application"]}}
```

**get_evidence_index**

request

```json
{}
```

response

```json
{"ok":false,"error":{"code":"consent_required","message":"Use the visible CiteApply application to continue.","safeActions":["use_visible_application"]}}
```

**get_validation_issues**

request

```json
{}
```

response

```json
{"ok":false,"error":{"code":"consent_required","message":"Use the visible CiteApply application to continue.","safeActions":["use_visible_application"]}}
```

**get_application_state**

request

```json
{"mode":"protected"}
```

response

```json
{"ok":true,"data":{"applicationRevision":2,"requirementsVersion":1,"stage":"draft","assistance":"allowed","activeFieldCount":6,"readyFieldCount":0,"blockerCount":6,"fields":[{"field":"legal_name","status":"missing"},{"field":"student_id","status":"missing"},{"field":"institution","status":"missing"},{"field":"preferred_contact_email","status":"missing"},{"field":"dependency","status":"missing"},{"field":"annual_household_income","status":"needs_human_action"}],"safeActions":["use_visible_application"]}}
```

**get_form_requirements**

request

```json
{"mode":"active"}
```

response

```json
{"ok":true,"data":{"applicationRevision":2,"requirementsVersion":1,"fields":[{"field":"legal_name","label":"Legal name","policy":"evidence","acceptedDocumentClasses":["synthetic_enrollment_record"],"active":true},{"field":"student_id","label":"Student ID","policy":"evidence","acceptedDocumentClasses":["synthetic_enrollment_record"],"active":true},{"field":"institution","label":"Institution","policy":"evidence","acceptedDocumentClasses":["synthetic_enrollment_record"],"active":true},{"field":"preferred_contact_email","label":"Preferred contact email","policy":"applicant_declared_test_email","acceptedDocumentClasses":[],"active":true},{"field":"dependency","label":"Dependency status","policy":"evidence","acceptedDocumentClasses":["synthetic_household_statement"],"active":true},{"field":"annual_household_income","label":"Annual household income","policy":"income_policy","acceptedDocumentClasses":["synthetic_household_statement","synthetic_income_statement"],"active":true}]}}
```

**get_evidence_index**

request

```json
{}
```

response

```json
{"ok":true,"data":{"documents":[{"code":"enrollment","title":"Synthetic Enrollment Record","documentClass":"synthetic_enrollment_record"},{"code":"household","title":"Synthetic Household Statement","documentClass":"synthetic_household_statement"},{"code":"income","title":"Synthetic Income Statement","documentClass":"synthetic_income_statement"}],"claims":[{"claimHandle":"41eamoaUQzN1F8u2a8IzVg","page":1,"document":"enrollment","kind":"legal_name","normalizedValue":"Anaya Rao"},{"claimHandle":"XmnXArv8cKwx6kQ8IvFO6w","page":1,"document":"enrollment","kind":"student_id","normalizedValue":"HZN-2026-0142"},{"claimHandle":"10H_N1MrRxeT4MXYxPlOog","page":1,"document":"enrollment","kind":"institution","normalizedValue":"Northstar Community College"},{"claimHandle":"2bC85MbO5NTv0Io5UPePWA","page":1,"document":"household","kind":"dependency","normalizedValue":true},{"claimHandle":"wDHoa492zHYxuzMeyNauFA","page":1,"document":"household","kind":"guardian_name","normalizedValue":"Meera Rao"},{"claimHandle":"ThDQVtE3kgKN-1gTQ36Uww","page":1,"document":"household","kind":"household_size","normalizedValue":4},{"claimHandle":"KY_Oulm8ZwVfT3d9Cq7BNQ","page":1,"document":"household","kind":"annual_household_income","normalizedValue":480000},{"claimHandle":"vnapBL9g052ESAoBP-8hfA","page":1,"document":"income","kind":"annual_household_income","normalizedValue":540000}]}}
```

**apply_evidence_backed_answers**

request

```json
{"requestId":"6d971f16-cf37-4768-ba55-42c8eb70ccf0","expectedApplicationRevision":2,"expectedRequirementsVersion":1,"changes":[{"kind":"bind_claim","field":"legal_name","claimHandle":"41eamoaUQzN1F8u2a8IzVg"},{"kind":"bind_claim","field":"student_id","claimHandle":"XmnXArv8cKwx6kQ8IvFO6w"},{"kind":"bind_claim","field":"institution","claimHandle":"10H_N1MrRxeT4MXYxPlOog"},{"kind":"bind_claim","field":"dependency","claimHandle":"2bC85MbO5NTv0Io5UPePWA"}]}
```

response

```json
{"ok":true,"data":{"applicationRevision":3,"requirementsVersion":2,"updatedFields":["legal_name","student_id","institution","dependency"],"rereadRequirements":true}}
```

**get_application_state**

request

```json
{"mode":"protected"}
```

response

```json
{"ok":true,"data":{"applicationRevision":3,"requirementsVersion":2,"stage":"draft","assistance":"allowed","activeFieldCount":8,"readyFieldCount":4,"blockerCount":4,"fields":[{"field":"legal_name","status":"ready","value":"Anaya Rao"},{"field":"student_id","status":"ready","value":"HZN-2026-0142"},{"field":"institution","status":"ready","value":"Northstar Community College"},{"field":"preferred_contact_email","status":"missing"},{"field":"dependency","status":"ready","value":true},{"field":"guardian_name","status":"missing"},{"field":"household_size","status":"missing"},{"field":"annual_household_income","status":"needs_human_action"}],"safeActions":["use_visible_application"]}}
```

**get_form_requirements**

request

```json
{"mode":"active"}
```

response

```json
{"ok":true,"data":{"applicationRevision":3,"requirementsVersion":2,"fields":[{"field":"legal_name","label":"Legal name","policy":"evidence","acceptedDocumentClasses":["synthetic_enrollment_record"],"active":true},{"field":"student_id","label":"Student ID","policy":"evidence","acceptedDocumentClasses":["synthetic_enrollment_record"],"active":true},{"field":"institution","label":"Institution","policy":"evidence","acceptedDocumentClasses":["synthetic_enrollment_record"],"active":true},{"field":"preferred_contact_email","label":"Preferred contact email","policy":"applicant_declared_test_email","acceptedDocumentClasses":[],"active":true},{"field":"dependency","label":"Dependency status","policy":"evidence","acceptedDocumentClasses":["synthetic_household_statement"],"active":true},{"field":"guardian_name","label":"Guardian name","policy":"evidence","acceptedDocumentClasses":["synthetic_household_statement"],"condition":{"field":"dependency","equals":true},"active":true},{"field":"household_size","label":"Household size","policy":"evidence","acceptedDocumentClasses":["synthetic_household_statement"],"condition":{"field":"dependency","equals":true},"active":true},{"field":"annual_household_income","label":"Annual household income","policy":"income_policy","acceptedDocumentClasses":["synthetic_household_statement","synthetic_income_statement"],"active":true}]}}
```

**apply_evidence_backed_answers**

request

```json
{"requestId":"33be98e3-7de7-45b3-a2ff-4e9c6119af10","expectedApplicationRevision":3,"expectedRequirementsVersion":2,"changes":[{"kind":"bind_claim","field":"guardian_name","claimHandle":"wDHoa492zHYxuzMeyNauFA"},{"kind":"bind_claim","field":"household_size","claimHandle":"ThDQVtE3kgKN-1gTQ36Uww"}]}
```

response

```json
{"ok":true,"data":{"applicationRevision":4,"requirementsVersion":2,"updatedFields":["guardian_name","household_size"],"rereadRequirements":false}}
```

**get_application_state**

request

```json
{"mode":"protected"}
```

response

```json
{"ok":true,"data":{"applicationRevision":4,"requirementsVersion":2,"stage":"draft","assistance":"allowed","activeFieldCount":8,"readyFieldCount":6,"blockerCount":2,"fields":[{"field":"legal_name","status":"ready","value":"Anaya Rao"},{"field":"student_id","status":"ready","value":"HZN-2026-0142"},{"field":"institution","status":"ready","value":"Northstar Community College"},{"field":"preferred_contact_email","status":"missing"},{"field":"dependency","status":"ready","value":true},{"field":"guardian_name","status":"ready","value":"Meera Rao"},{"field":"household_size","status":"ready","value":4},{"field":"annual_household_income","status":"needs_human_action"}],"safeActions":["use_visible_application"]}}
```

**apply_evidence_backed_answers**

request

```json
{"requestId":"f47497e9-1de6-43ee-8aca-fda0f527ba71","expectedApplicationRevision":4,"expectedRequirementsVersion":2,"changes":[{"kind":"bind_claim","field":"annual_household_income","claimHandle":"vnapBL9g052ESAoBP-8hfA"}]}
```

response

```json
{"ok":false,"error":{"code":"conflict_requires_human","message":"Income sources disagree. Resolve this in CiteApply.","safeActions":["resolve_in_visible_application"]}}
```

**get_application_state**

request

```json
{"mode":"protected"}
```

response

```json
{"ok":true,"data":{"applicationRevision":4,"requirementsVersion":2,"stage":"draft","assistance":"allowed","activeFieldCount":8,"readyFieldCount":6,"blockerCount":2,"fields":[{"field":"legal_name","status":"ready","value":"Anaya Rao"},{"field":"student_id","status":"ready","value":"HZN-2026-0142"},{"field":"institution","status":"ready","value":"Northstar Community College"},{"field":"preferred_contact_email","status":"missing"},{"field":"dependency","status":"ready","value":true},{"field":"guardian_name","status":"ready","value":"Meera Rao"},{"field":"household_size","status":"ready","value":4},{"field":"annual_household_income","status":"needs_human_action"}],"safeActions":["use_visible_application"]}}
```

**get_application_state**

request

```json
{"mode":"protected"}
```

response

```json
{"ok":true,"data":{"applicationRevision":4,"requirementsVersion":2,"stage":"draft","assistance":"allowed","activeFieldCount":8,"readyFieldCount":6,"blockerCount":2,"fields":[{"field":"legal_name","status":"ready","value":"Anaya Rao"},{"field":"student_id","status":"ready","value":"HZN-2026-0142"},{"field":"institution","status":"ready","value":"Northstar Community College"},{"field":"preferred_contact_email","status":"missing"},{"field":"dependency","status":"ready","value":true},{"field":"guardian_name","status":"ready","value":"Meera Rao"},{"field":"household_size","status":"ready","value":4},{"field":"annual_household_income","status":"needs_human_action"}],"safeActions":["use_visible_application"]}}
```

**apply_evidence_backed_answers**

request

```json
{"requestId":"b0db1558-d54a-4a91-acaf-75bfa3357dfa","expectedApplicationRevision":4,"expectedRequirementsVersion":2,"changes":[{"kind":"propose_email","field":"preferred_contact_email","value":"anaya.rao@example.test"}]}
```

response

```json
{"ok":true,"data":{"applicationRevision":5,"requirementsVersion":2,"updatedFields":["preferred_contact_email"],"rereadRequirements":false}}
```

**get_application_state**

request

```json
{"mode":"protected"}
```

response

```json
{"ok":true,"data":{"applicationRevision":5,"requirementsVersion":2,"stage":"draft","assistance":"allowed","activeFieldCount":8,"readyFieldCount":6,"blockerCount":2,"fields":[{"field":"legal_name","status":"ready","value":"Anaya Rao"},{"field":"student_id","status":"ready","value":"HZN-2026-0142"},{"field":"institution","status":"ready","value":"Northstar Community College"},{"field":"preferred_contact_email","status":"needs_declaration","value":"anaya.rao@example.test"},{"field":"dependency","status":"ready","value":true},{"field":"guardian_name","status":"ready","value":"Meera Rao"},{"field":"household_size","status":"ready","value":4},{"field":"annual_household_income","status":"needs_human_action"}],"safeActions":["use_visible_application"]}}
```

**prepare_submission_review**

request

```json
{"requestId":"fca69755-b315-4e79-a0ee-0b7ee41cc77c","expectedApplicationRevision":5,"expectedRequirementsVersion":2}
```

response

```json
{"ok":false,"error":{"code":"not_ready_for_review","message":"The application is not ready for Review.","safeActions":["use_visible_application"],"blockers":[{"code":"conflict_requires_human","field":"annual_household_income","message":"Income sources disagree. Resolve this in CiteApply.","action":"resolve_in_visible_application"},{"code":"declaration_required","field":"preferred_contact_email","message":"Declare the saved synthetic email in CiteApply.","action":"use_visible_application"}]}}
```

**get_application_state**

request

```json
{"mode":"protected"}
```

response

```json
{"ok":true,"data":{"applicationRevision":7,"requirementsVersion":2,"stage":"draft","assistance":"allowed","activeFieldCount":8,"readyFieldCount":8,"blockerCount":0,"fields":[{"field":"legal_name","status":"ready","value":"Anaya Rao"},{"field":"student_id","status":"ready","value":"HZN-2026-0142"},{"field":"institution","status":"ready","value":"Northstar Community College"},{"field":"preferred_contact_email","status":"ready","value":"anaya.rao@example.test","humanActionComplete":true},{"field":"dependency","status":"ready","value":true},{"field":"guardian_name","status":"ready","value":"Meera Rao"},{"field":"household_size","status":"ready","value":4},{"field":"annual_household_income","status":"ready","resolution":"human_completed","humanActionComplete":true}],"safeActions":["use_visible_application"]}}
```

**prepare_submission_review**

request

```json
{"requestId":"83f505b6-752d-4f81-a824-b7a02a43c703","expectedApplicationRevision":7,"expectedRequirementsVersion":2}
```

response

```json
{"ok":true,"data":{"applicationRevision":8,"requirementsVersion":2,"readiness":"ready","reviewRef":"-Chm60ittPDnvdX3sVopC1"}}
```

**get_application_state**

request

```json
{"mode":"protected"}
```

response

```json
{"ok":false,"error":{"code":"consent_required","message":"Use the visible CiteApply application to continue.","safeActions":["use_visible_application"]}}
```
