import React from 'react';
import Namespace from '../../lib/k8s/namespace';
import { useFilterFunc } from '../../lib/util';
import { Link } from '../common';
import { StatusLabel } from '../common/Label';
import { SectionBox } from '../common/SectionBox';
import SectionFilterHeader from '../common/SectionFilterHeader';
import SimpleTable from '../common/SimpleTable';

export default function NamespacesList() {
  const [namespaces, error] = Namespace.useList();
  const filterFunc = useFilterFunc();

  function makeStatusLabel(namespace: Namespace) {
    const status = namespace.status.phase;
    return (
      <StatusLabel status={status === 'Active' ? 'success' : 'error'}>
        {status}
      </StatusLabel>
    );
  }

  return (
    <SectionBox
      title={
        <SectionFilterHeader
          title="Namespaces"
          noNamespaceFilter
          headerStyle="main"
        />
      }
    >
      <SimpleTable
        rowsPerPage={[15, 25, 50]}
        filterFunction={filterFunc}
        errorMessage={Namespace.getErrorMessage(error)}
        columns={[
          {
            label: 'Name',
            getter: (namespace) =>
              <Link kubeObject={namespace} />,
            sort: (n1: Namespace, n2: Namespace) => {
              if (n1.metadata.name < n2.metadata.name) {
                return -1;
              } else if (n1.metadata.name > n2.metadata.name) {
                return 1;
              }
              return 0;
            }
          },
          {
            label: 'Status',
            getter: makeStatusLabel
          },
          {
            label: 'Age',
            getter: (namespace) => namespace.getAge(),
            sort: (n1: Namespace, n2: Namespace) =>
              new Date(n2.metadata.creationTimestamp).getTime() -
              new Date(n1.metadata.creationTimestamp).getTime()
          },
        ]}
        data={namespaces}
        defaultSortingColumn={3}
      />
    </SectionBox>
  );
}
