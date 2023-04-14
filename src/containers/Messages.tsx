// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH

import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { useAppContext } from '../azure/AppContext';
import { withStyles } from '@mui/styles';
import { useTypeDispatch, useTypeSelector } from '../store';
import { fetchMailFoldersData, fetchMessagesData } from '../actions/messages';
import { Avatar, Badge, Button, Checkbox, IconButton, List, ListItem, ListItemAvatar, ListItemButton, ListItemIcon, ListItemText, Menu, MenuItem, Paper, Tooltip, Typography } from '@mui/material';
import { MailFolder, Message } from 'microsoft-graph';
import { Editor } from '@tinymce/tinymce-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AuthenticatedView from '../components/AuthenticatedView';
import SearchTextfield from '../components/SearchTextfield';
import { FilterList, Forward } from '@mui/icons-material';
import { debounce } from 'lodash';
import FolderList from '../components/FolderList';
import Hover from '../components/Hover';

const styles: any = {
  content: {
    flex: 1,
    height: '100%',
    display: 'flex',
  },
  mailList: {
    width: 400,
    overflowY: 'auto',
    height: 0, // Used to get inside-div scrolling
    minHeight: '100%',
    padding: 0,
  },
  tinyMceContainer: {
    flex: 1,
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
  },
  flexRow: {
    display: 'flex',
    flex: 1,
  },
  flexContainer: {
    display: 'flex',
    flexDirection: 'column',
    margin: "0 16px",
  },
  messages: {
    flex: 1,
    marginTop: 16,
  },
  search: {
    flex: 1,
    marginRight: 4,
  },
  mailActionsContainer: {
    marginBottom: 4,
  },
  filterRow: {
    display: 'flex',
  },
  iconButtonContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  menu: {
    margin: 0,
  },
};

type MessagesProps = {
  classes: any;
}

function objectToCNF(filters: any) {
  return Object.entries(filters)
    .filter(e => e[1])
    .map(e => e[0])
    .join(" and ");
}

const filterOptions = [
  { label: "High importance", value: "importance eq 'high'" },
  { label: "Unread", value: "isRead eq false" },
  { label: "Attachments", value: "hasAttachments eq true" }
]

function Messages({ classes }: MessagesProps) {
  const app = useAppContext();
  const { t } = useTranslation();
  const editorRef = useRef({});
  const [selectedFolder, setSelectedFolder] = useState<MailFolder | null>(null); // TODO: Get default somehow
  const [selectedMsg, setSelectedMsg] = useState<Message | null>(null);
  const [checkedMessages, setCheckedMessages] = useState<Array<Message>>([]);
  const [filterAnchor, setFilterAnchor] = useState<null | HTMLElement>(null);
  const [mailFilters, setMailFilters] = useState<any>({});
  const dispatch = useTypeDispatch();
  const { mails: messages, mailFolders } = useTypeSelector(state => state.messages);
  const navigate = useNavigate();

  // componentDidMount()
  useEffect(() => {
    dispatch(fetchMessagesData({app}));
    dispatch(fetchMailFoldersData(app));
  }, []);

  const debouncedSearch = debounce(async (search: string, folderid?: string) => {
    await dispatch(fetchMessagesData({
      app,
      folderid,
      params: {
        search: search === '""' ? undefined : search,
      },
    }));
  }, 250);

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    debouncedSearch(`"${value}"`, selectedFolder?.id);
  };

  const handleMailFolderClick = (folder: MailFolder) => () => {
    setSelectedFolder(folder);
    dispatch(fetchMessagesData({app, folderid: folder?.id, params: { filter: objectToCNF(mailFilters) || undefined }}))
  }

  const handleMailClick = (msg: Message) => () => setSelectedMsg(msg);

  const handleNewMessage = () => navigate('/newMessage');

  /*const handleContactSelect = () => {
    const contacts = useTypeSelector(state => state.gab.seletion);
    if(selectedMsg) postMessageForward(app.authProvider!, selectedMsg, {
      toRecipients: contacts.map((contact: Contact) => {
        if(contact?.emailAddresses && contact?.emailAddresses?.length > 0) {
          return  {
            emailAddress: {
              ...contact.emailAddresses[0] //TODO: This should not be hardcoded in the future
            }
          }
        } else {
          return null;
        }
      })
    })
  }*/

  const handleForward = () => {
    navigate('/newMessage', { state: selectedMsg });
  }

  const handleFilterMenu = (event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setFilterAnchor(null);
  };

  const handleFilter = (filter: string) => () => {
    setMailFilters({
      ...mailFilters,
      [filter]: !mailFilters[filter],
    });
  }

  useEffect(() => {
    dispatch(fetchMessagesData({
      app,
      folderid: selectedFolder?.id,
      params: {
        filter: objectToCNF(mailFilters) || undefined,
      },
    }));
  }, [mailFilters]);

  const handleMailCheckbox = (message: Message) => (e: ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const copy = [...checkedMessages];
    if(e.target.checked) {
      copy.push(message);
    } else {
      copy.splice(copy.findIndex(m => m.id === message.id), 1);
    }
    setCheckedMessages(copy);
  }

  return (
    <AuthenticatedView
      header={t("Messages")}
      actions={[
        <Button key={0} onClick={handleNewMessage} variant='contained' color="primary">
          {t("New message")}
        </Button>
      ]}
    >
      <div className={classes.content}>
        <FolderList>
          {mailFolders.map((folder: MailFolder, idx: number) => 
            <ListItem disablePadding key={idx}>
              <ListItemButton
                onClick={handleMailFolderClick(folder)}
                selected={selectedFolder?.id === folder.id}
                divider
              >
                <ListItemText primary={folder.displayName} />
                <Badge
                  badgeContent={folder.unreadItemCount}
                  color="primary"
                >
                  <div style={{width: 16, height: 12}}></div>
                </Badge>
              </ListItemButton>
            </ListItem>)}
        </FolderList>
        <div className={classes.flexContainer}>
          <div className={classes.filterRow}>
            <SearchTextfield
              className={classes.search}
              label="Filter mails"
              onChange={handleSearch}
            />
            <div className={classes.iconButtonContainer}>
              <IconButton
                aria-controls={filterAnchor ? 'long-menu' : undefined}
                aria-expanded={filterAnchor ? 'true' : undefined}
                aria-haspopup="true"
                style={{ height: 40 }}
                onClick={handleFilterMenu}
              >
                <FilterList />
              </IconButton>
            </div>
            <Menu
              anchorEl={filterAnchor}
              open={!!filterAnchor}
              onClose={handleMenuClose}
              PaperProps={{
                className: classes.menu,
              }}
            >
              {filterOptions.map(({ label, value }, key) =>
                <MenuItem
                  key={key}
                  selected={mailFilters[value]}
                  onClick={handleFilter(value)}
                >
                  {t(label)}
                </MenuItem>
              )}
            </Menu>
          </div>
          <Paper className={classes.messages}>
            <List className={classes.mailList}>
              {messages.map((message: Message, key: number) => {
                const names = message.sender?.emailAddress?.name?.split(" ") || [" ", " "];
                const selected = checkedMessages.includes(message);
                return <Hover key={key}>
                  {(hover: boolean) => hover || checkedMessages.length > 0 ? <ListItemButton
                    selected={selected}
                    onClick={handleMailClick(message)}
                  >
                    <ListItemIcon>
                      <Checkbox
                        sx={{ p: 0.5 }}
                        checked={selected}
                        onChange={handleMailCheckbox(message)}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={message.subject}
                      secondary={message.bodyPreview}
                    />
                  </ListItemButton>: <ListItemButton
                    selected={selected}
                    onClick={handleMailClick(message)}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ width: 32, height: 32 }}>
                        <Typography variant='body2'>{names[0][0]}{names[names.length - 1][0]}</Typography>
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={message.subject}
                      secondary={message.bodyPreview}
                    />
                  </ListItemButton> }
                </Hover>;
              })}
            </List>
          </Paper>
        </div>
        <Paper id="readonlyDiv" className={classes.tinyMceContainer}>
          {selectedMsg && <div id="mailActionsContainer" className={classes.mailActionsContainer}>
            <Tooltip title={t("Forward")} placement="top">
              <IconButton onClick={handleForward}>
                <Forward />
              </IconButton>
            </Tooltip>
          </div>}
          {selectedMsg?.from?.emailAddress &&
            <Typography variant="h4">
              {selectedMsg.from.emailAddress.name || ''} &lt;{selectedMsg.from.emailAddress.address || ''}&gt;
            </Typography>}
          {selectedMsg?.body?.content && <div className={classes.flexRow}>
            <Editor
              tinymceScriptSrc={process.env.PUBLIC_URL + '/tinymce/tinymce.min.js'}
              onInit={(evt, editor) => editorRef.current = editor}
              initialValue={selectedMsg?.body?.content}
              disabled
              init={{
                disabled: true,
                menubar: false,
                readonly: true,
                toolbar: '',
                plugins: ['wordcount'],
                width: '100%',
                height: '100%', // Doesn't work on its own. The .tox-tinymce class has been overwritten as well
              }}
            /></div>}
        </Paper>
      </div>
    </AuthenticatedView>
  );
  // </ReturnSnippet>
}


export default withStyles(styles)(Messages);
