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

We currently added a Network Policy Advisor under the Network tab. In the Frontend. 

And an Network Policy Advisor Wrapper in the Backend (/backend/cmd/advisor_wapper.go) to start the wrapper on the Kubernetes Cluster the Inspektor Gadget needs to be delployed. Inside that Cluster. 