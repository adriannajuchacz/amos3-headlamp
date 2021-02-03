import chevronLeft from '@iconify/icons-mdi/chevron-left';
import eyeIcon from '@iconify/icons-mdi/eye';
import eyeOff from '@iconify/icons-mdi/eye-off';
import menuDown from '@iconify/icons-mdi/menu-down';
import menuUp from '@iconify/icons-mdi/menu-up';
import { Icon } from '@iconify/react';
import { Button, InputLabel } from '@material-ui/core';
import Box from '@material-ui/core/Box';
import Divider from '@material-ui/core/Divider';
import Grid, { GridProps } from '@material-ui/core/Grid';
import IconButton from '@material-ui/core/IconButton';
import Input, { InputProps } from '@material-ui/core/Input';
import { makeStyles } from '@material-ui/core/styles';
import { TextFieldProps } from '@material-ui/core/TextField';
import Typography, { TypographyProps } from '@material-ui/core/Typography';
import Editor from '@monaco-editor/react';
import { Base64 } from 'js-base64';
import _ from 'lodash';
import * as monaco from 'monaco-editor';
import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { KubeCondition, KubeContainer, KubeObject, KubeObjectInterface } from '../../lib/k8s/cluster';
import { createRouteURL, RouteURLProps } from '../../lib/router';
import { localeDate } from '../../lib/util';
import { useTypedSelector } from '../../redux/reducers/reducers';
import Loader from '../common/Loader';
import { SectionBox } from '../common/SectionBox';
import SectionHeader, { HeaderStyleProps } from '../common/SectionHeader';
import SimpleTable, { NameValueTable, NameValueTableRow } from '../common/SimpleTable';
import DeleteButton from './DeleteButton';
import EditButton from './EditButton';
import Empty from './EmptyContent';
import { DateLabel, HoverInfoLabel, StatusLabel, StatusLabelProps } from './Label';
import Link from './Link';
import { LightTooltip } from './Tooltip';
import Tooltip from '@material-ui/core/Tooltip';
import fileDownloadOutline from '@iconify/icons-mdi/file-download-outline';





const useStyles = makeStyles(theme => ({
  metadataValueLabel: {
    color: theme.palette.text.primary,
    backgroundColor: theme.palette.metadataBgColor,
    fontSize: '1.1em',
    wordBreak: 'break-word',
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1),
  },
}));

interface MetadataDisplayProps {
  resource: KubeObjectInterface;
  extraRows?: NameValueTableRow[] | null;
}

export function MetadataDisplay(props: MetadataDisplayProps) {
  const { resource, extraRows } = props;

  const mainRows = ([
    {
      name: 'Name',
      value: resource.metadata.name,
    },
    {
      name: 'Namespace',
      value: resource.metadata.namespace && resource.metadata.namespace,
      hide: !resource.metadata.namespace
    },
    {
      name: 'Creation',
      value: localeDate(resource.metadata.creationTimestamp),
    },
    {
      name: 'Labels',
      value: resource.metadata.labels && <MetadataDictGrid dict={resource.metadata.labels} />,
      hide: !resource.metadata.labels,
    },
    {
      name: 'Annotations',
      value: resource.metadata.annotations &&
        <MetadataDictGrid dict={resource.metadata.annotations} />,
      hide: !resource.metadata.annotations,
    },
  ] as NameValueTableRow[]).concat(extraRows || []);

  return (
    <NameValueTable rows={mainRows}/>
  );
}

interface MetadataDictGridProps {
  dict: {
    [index: string]: string;
    [index: number]: string;
  };
  showKeys?: boolean;
}

export function MetadataDictGrid(props: MetadataDictGridProps) {
  const classes = useStyles();
  const { dict, showKeys = true } = props;
  const [expanded, setExpanded] = React.useState(false);
  const defaultNumShown = 20;

  const keys = Object.keys(dict || []);

  const MetadataEntry = React.forwardRef((props: TypographyProps, ref) => {
    return (
      <Typography
        noWrap
        {...props}
        className={classes.metadataValueLabel}
        ref={ref}
      />
    );
  });

  function makeLabel(key: string | number) {
    let fullText = dict[key];

    if (showKeys) {
      fullText = key + ': ' + fullText;
    }

    let shortText = fullText;

    // Shorten the label manually because relying on the ellipsing methods
    // was not working (it would correctly ellipse the text, but the width of it
    // would still extend the area/section where the text is contained).
    if (fullText.length > 50) {
      shortText = fullText.substr(0, 50) + '…';
    }

    let labelComponent = <MetadataEntry>{shortText}</MetadataEntry>;

    // If the full label is not being shown, use a tooltip to show the full text
    // to the user (so they select it, etc.).
    if (fullText.length !== shortText.length) {
      labelComponent = (
        <LightTooltip
          title={fullText}
          children={labelComponent}
          interactive
        />
      );
    }
    return labelComponent;
  }

  return (
    <Grid
      container
      spacing={1}
      justify="flex-start"
    >
      {keys.length > defaultNumShown &&
        <Grid item>
          <IconButton onClick={() => setExpanded(!expanded)} size="small">
            <Icon icon={expanded ? menuUp : menuDown} />
          </IconButton>
        </Grid>
      }
      <Grid
        container
        item
        justify="flex-start"
        spacing={1}
        style={{
          maxWidth: '80%'
        }}
      >
        {/* Limit the size to two entries until the user chooses to expand the whole section */}
        {keys.slice(0, expanded ? keys.length : defaultNumShown).map((key, i) =>
          <Grid key={i} item zeroMinWidth>
            {makeLabel(key)}
          </Grid>
        )}
      </Grid>
    </Grid>
  );
}

interface ResourceLinkProps {
  name?: string;
  routeName?: string;
  routeParams?: RouteURLProps;
  resource: KubeObjectInterface;
}

export function ResourceLink(props: ResourceLinkProps) {
  const {
    routeName = props.resource.kind,
    routeParams = props.resource.metadata as RouteURLProps,
    name = props.resource.metadata.name,
  } = props;

  return (
    <Link
      routeName={routeName}
      params={routeParams}
    >
      {name}
    </Link>
  );
}

interface MainInfoSectionProps {
  resource: KubeObject | null;
  headerSection?: React.ReactNode;
  title?: string;
  extraInfo?: NameValueTableRow[] | null;
  actions?: React.ReactNode[] | null;
  headerStyle?: HeaderStyleProps['headerStyle'];
  noDefaultActions?: boolean;
}

export function MainInfoSection(props: MainInfoSectionProps) {
  const {
    resource,
    headerSection,
    title,
    extraInfo = [],
    actions = [],
    headerStyle = 'main',
    noDefaultActions = false,
  } = props;
  const headerActions = useTypedSelector(state => state.ui.views.details.headerActions);

  function getHeaderActions() {
    return React.Children.toArray(Object.values(headerActions).map(action =>
      action({item: resource})));
  }

  function downloadFile() {
    const element = document.createElement('a');
    const file = new Blob([JSON.stringify(resource.jsonData, null, 2)], { type: 'application/json' });
    let filename = resource.jsonData.metadata.name;
    element.href = URL.createObjectURL(file);
    element.download = `${filename}.yml`;
    // Required for FireFox
    document.body.appendChild(element);
    element.click();
  }

  let defaultActions: MainInfoSectionProps['actions'] = [];

  if (!noDefaultActions && resource) {
    defaultActions = [
      <Tooltip title="Download">
      <IconButton
        aria-label="download"
        onClick={downloadFile}
      >
        <Icon icon={fileDownloadOutline} />
      </IconButton>
    </Tooltip>,
      <EditButton item={resource} />,
      <DeleteButton item={resource} />
    ];
  }

  return (
    <>
      {resource &&
        <Button
          startIcon={<Icon icon={chevronLeft} />}
          size="small"
          component={RouterLink}
          to={createRouteURL(resource.listRoute)}
        >
          <Typography style={{paddingTop: '3px'}}>Back</Typography>
        </Button>
      }
      <SectionBox
        title={
          <SectionHeader
            title={title || (resource ? resource.kind : '')}
            headerStyle={headerStyle}
            actions={
              getHeaderActions().concat(React.Children.toArray(actions))
                .concat(defaultActions)
            }
          />
        }
      >
        {resource === null ?
          <Loader />
          :
          <React.Fragment>
            {headerSection}
            <MetadataDisplay
              resource={resource}
              extraRows={extraInfo}
            />
          </React.Fragment>
        }
      </SectionBox>
    </>
  );
}

interface PageGridProps extends GridProps {
  sections?: React.ReactNode[];
}

export function PageGrid(props: PageGridProps) {
  const { sections = [], children = [], ...other } = props;
  const childrenArray = React.Children.toArray(children).concat(sections);
  return (
    <Grid
      container
      spacing={1}
      justify="flex-start"
      alignItems="stretch"
      {...other}
    >
      {childrenArray.map((section, i) =>
        <Grid item key={i} xs={12}>
          {section}
        </Grid>
      )}
    </Grid>
  );
}

interface SectionGridProps {
  items: React.ReactNode[];
  useDivider?: boolean;
}

export function SectionGrid(props: SectionGridProps) {
  const { items } = props;
  return (
    <Grid
      container
      justify="space-between"
    >
      {items.map((item, i) => {
        return (
          <Grid
            item
            md={12}
            xs={12}
            key={i}
          >
            {item}
          </Grid>
        );
      })}
    </Grid>
  );
}

export function DataField(props: TextFieldProps) {
  const { label, value } = props;
  function handleEditorDidMount(_: () => {}, editor: monaco.editor.IStandaloneCodeEditor) {
    const editorElement: HTMLElement | null = editor.getDomNode();
    if (!editorElement) {
      return;
    }
    const lineCount = editor.getModel()?.getLineCount() || 1;
    if (lineCount <= 10) {
      editorElement.style.height = '10vh';
    } else {
      editorElement.style.height = '40vh';
    }
    editor.layout();
  }
  let language = ((label as string).split('.').pop() as string);
  if (language !== 'json') {
    language = 'yaml';
  }
  return (
    <>
      <Box borderTop={0} border={1}>
        <Box display="flex">
          <Box width="10%" borderTop={1} height={'1px'}>
          </Box>
          <Box pb={1} mt={-1} px={0.5}>
            <InputLabel>{label}</InputLabel>
          </Box>
          <Box width="100%" borderTop={1} height={'1px'}>
          </Box>
        </Box>
        <Box mt={1} px={1} pb={1}>
          <Editor
            value={value as string}
            language={language}
            editorDidMount={handleEditorDidMount}
            options = {{'readOnly': true, 'lineNumbers': 'off'}}
            theme="vs-dark"
          />
        </Box>
      </Box>
    </>
  );
}

export function SecretField(props: InputProps) {
  const { value, ...other } = props;
  const [showPassword, setShowPassword] = React.useState(false);

  function handleClickShowPassword() {
    setShowPassword(!showPassword);
  }

  return (
    <Grid
      container
      alignItems="stretch"
      spacing={2}
    >
      <Grid item>
        <IconButton
          edge="end"
          aria-label="toggle field visibility"
          onClick={handleClickShowPassword}
          onMouseDown={event => event.preventDefault()}
        >
          <Icon icon={showPassword ? eyeOff : eyeIcon} />
        </IconButton>
      </Grid>
      <Grid item xs>
        <Input
          readOnly
          type="password"
          fullWidth
          multiline={showPassword}
          rowsMax="20"
          value={showPassword ? Base64.decode(value as string) : '******'}
          {...other}
        />
      </Grid>
    </Grid>
  );
}

interface ConditionsTableProps {
  resource: KubeObjectInterface | null;
  showLastUpdate?: boolean;
}

export function ConditionsTable(props: ConditionsTableProps) {
  const { resource, showLastUpdate = true } = props;

  function makeStatusLabel(condition: KubeCondition) {
    let status: StatusLabelProps['status'] = '';
    if (condition.type === 'Available') {
      status = condition.status === 'True' ? 'success' : 'error';
    }

    return (
      <StatusLabel
        status={status}
      >
        {condition.type}
      </StatusLabel>
    );
  }

  function getColumns() {
    const cols: {
      label: string;
      getter: (arg: KubeCondition) => void;
      hide?: boolean;
    }[] = [
      {
        label: 'Condition',
        getter: makeStatusLabel
      },
      {
        label: 'Status',
        getter: condition => condition.status,
      },
      {
        label: 'Last Transition',
        getter: condition => <DateLabel date={condition.lastTransitionTime as string} />,
      },
      {
        label: 'Last Update',
        getter: condition => condition.lastUpdateTime ? <DateLabel date={condition.lastUpdateTime as string} /> : '-',
        hide: !showLastUpdate
      },
      {
        label: 'Reason',
        getter: condition =>
          condition.reason ?
            <HoverInfoLabel
              label={condition.reason}
              hoverInfo={condition.message}
            />
            :
            '-'
      }
    ];

    // Allow to filter the columns by using a hide field
    return cols.filter(col => !col.hide);
  }

  return (
    <SimpleTable
      data={(resource && resource.status && resource.status.conditions) || {}}
      columns={getColumns()}
    />
  );
}

export function ContainerInfo(props: {container: KubeContainer}) {
  const {container} = props;

  function containerRows() {
    const env: { [name: string]: string } = {};
    (container.env || []).forEach(envVar => {
      let value = '';

      if (envVar.value) {
        value = envVar.value;
      } else if (envVar.valueFrom) {
        if (envVar.valueFrom.fieldRef) {
          value = envVar.valueFrom.fieldRef.fieldPath;
        } else if (envVar.valueFrom.secretKeyRef) {
          value = envVar.valueFrom.secretKeyRef.key;
        }
      }

      env[envVar.name] = value;
    });

    return ([
      {
        name: 'Image',
        value: container.image,
      },
      {
        name: 'Args',
        value: container.args &&
          <MetadataDictGrid dict={container.args as {[index: number]: string}} showKeys={false} />,
        hide: !container.args
      },
      {
        name: 'Command',
        value: (container.command || []).join(' '),
        hide: !container.command
      },
      {
        name: 'Environment',
        value: <MetadataDictGrid dict={env} />,
        hide: _.isEmpty(env),
      },
    ]);
  }

  return (
    <Box py={1}>
      <SectionHeader
        noPadding
        title={container.name}
        headerStyle="normal"
      />
      <NameValueTable
        rows={containerRows()}
      />
    </Box>
  );
}

export function ContainersSection(props: {resource: KubeObjectInterface | null}) {
  const { resource } = props;

  function getContainers() {
    if (!resource) {
      return [];
    }

    let containers: KubeContainer[] = [];

    if (resource.spec) {
      if (resource.spec.containers) {
        containers = resource.spec.containers;
      } else if (resource.spec.template && resource.spec.template.spec) {
        containers = resource.spec.template.spec.containers;
      }
    }

    return containers;
  }

  const containers = getContainers();
  const numContainers = containers.length;

  return (
    <SectionBox title="Containers">
      {numContainers === 0 ?
        <Empty>No containers to show</Empty>
        :
        containers.map((container: any, i: number) => {
          return (
            <React.Fragment key={i}>
              <ContainerInfo container={container} />
              {/* Don't show the divider if this is the last container */}
              { (i !== (numContainers - 1)) && <Divider /> }
            </React.Fragment>
          );
        })}
    </SectionBox>
  );
}

export function ReplicasSection(props: {resource: KubeObjectInterface | null }) {
  const { resource } = props;

  if (!resource) {
    return null;
  }

  return (
    <SectionBox title="Conditions">
      <ConditionsTable resource={resource} />
    </SectionBox>
  );
}
