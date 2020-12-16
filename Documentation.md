# Headlamp Documentation

## Building
The Backend and Frontend can build at the same time with:
```bash
make
```
Or Seperatly with:
```bash
make frontend
make backend
```

## Starting
To start Headlamp you first need to start the backend and then the frontend after building them.
```bash
make run-backend
make run-frontend
```
## Technical details
Headlamp is documented inside the README.md and under docs with more details.

## Changelog

### mid-project-release

#### Frontend changelog
/src/components/sidebar.tsx --> build Network Policy Advisor Tab inside

/src/components/advisor/List.tsx --> generate a List of avablie Namespaces

/src/lib/k8s/advisor.ts --> add KubeObject for Network Policy Advisor

/src/lib/k8s/router.tsx --> add path for Network Poilicy Advisor

#### Backend changelog

/cmd/advisor_wrapper.go --> Wrapper to call the Network Policy Advisor. Inspektor Gadget need to be deployed on the Kubernetes Cluster.
