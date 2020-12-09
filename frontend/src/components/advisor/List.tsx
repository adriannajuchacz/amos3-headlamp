import React from 'react';
import Advisor from '../../lib/k8s/advisor';
import { useFilterFunc } from '../../lib/util';
import Link from '../common/Link';
import { SectionBox } from '../common/SectionBox';
import SectionFilterHeader from '../common/SectionFilterHeader';
import SimpleTable from '../common/SimpleTable';

export default function AdvisorList(){
    const [advisor, error] = Advisor.useList();

    return (
        <SectionBox
            title="Network Policy Advisor"
        />
    )
}