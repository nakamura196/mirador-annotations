import React, { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  getAuth,
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { MiradorMenuButton } from 'mirador/dist/es/src/components/MiradorMenuButton';
import AccountCircleIcon from '@material-ui/icons/AccountCircle';
import ExitToAppIcon from '@material-ui/icons/ExitToApp';
import { connect } from 'react-redux';
import * as actions from 'mirador/dist/es/src/state/actions';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  makeStyles,
  Divider,
  Menu,
  MenuItem,
  Avatar,
  ListItemIcon,
  ListItemText,
} from '@material-ui/core';

const useStyles = makeStyles((theme) => ({
  dialogContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
    minWidth: 300,
  },
  divider: {
    flex: 1,
  },
  dividerContainer: {
    alignItems: 'center',
    display: 'flex',
    margin: theme.spacing(2, 0),
  },
  dividerText: {
    color: theme.palette.text.secondary,
    margin: theme.spacing(0, 2),
  },
  errorText: {
    color: theme.palette.error.main,
    marginTop: theme.spacing(1),
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
  },
  googleButton: {
    backgroundColor: '#4285f4',
    color: 'white',
    '&:hover': {
      backgroundColor: '#357ae8',
    },
  },
  menuButton: {
    '&:hover': {
      backgroundColor: 'transparent',
    },
    padding: theme.spacing(0.5),
  },
  smallAvatar: {
    height: theme.spacing(3),
    width: theme.spacing(3),
  },
  userInfo: {
    alignItems: 'center',
    display: 'flex',
    gap: theme.spacing(1),
  },
}));

/**
 * Googleアカウントとメールでの認証を管理するボタンコンポーネント
 * @param {Object} props
 * @param {Array} props.canvases - キャンバスの配列
 * @param {Object} props.config - 設定オブジェクト
 * @param {Function} props.receiveAnnotation - アノテーションを受け取るコールバック
 */
function GoogleAuthButton({ canvases, config, receiveAnnotation }) {
  const classes = useStyles();
  const [user, setUser] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);

  const refreshAnnotations = useCallback(() => {
    if (canvases?.[0]) {
      const storageAdapter = config.annotation.adapter(canvases[0].id);
      storageAdapter?.all().then((annoPage) => {
        receiveAnnotation(
          canvases[0].id,
          storageAdapter.annotationPageId,
          annoPage,
        );
      });
    }
  }, [canvases, config, receiveAnnotation]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuth(), (newUser) => {
      setUser(newUser);
      refreshAnnotations();
    });

    return () => unsubscribe();
  }, [refreshAnnotations]);

  /**
   * Googleアカウントでログインする
   */
  const handleLogin = () => {
    signInWithPopup(getAuth(), new GoogleAuthProvider())
      .then(() => {
        setShowDialog(false);
      })
      .catch((err) => {
        setError('Googleログインに失敗しました');
        console.error('ログインエラー:', err);
      });
  };

  /**
   * ログアウトする
   */
  const handleLogout = () => {
    signOut(getAuth())
      .catch((err) => console.error('ログアウトエラー:', err));
  };

  /**
   * メールアドレスでログインまたはサインアップする
   */
  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(getAuth(), email, password);
      } else {
        await signInWithEmailAndPassword(getAuth(), email, password);
      }
      setShowDialog(false);
      setEmail('');
      setPassword('');
    } catch (err) {
      setError(err.message);
    }
  };

  /**
   * ダイアログを閉じる
   */
  const handleClose = () => {
    setShowDialog(false);
    setError('');
    setEmail('');
    setPassword('');
  };

  /**
   * ユーザーメニューをクリックする
   */
  const handleUserMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  /**
   * ユーザーメニューを閉じる
   */
  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  /**
   * ログアウトする
   */
  const handleLogoutClick = () => {
    handleLogout();
    handleUserMenuClose();
  };

  return user ? (
    <>
      <MiradorMenuButton
        aria-label="User menu"
        onClick={handleUserMenuClick}
        size="small"
        className={classes.menuButton}
      >
        <div className={classes.userInfo}>
          <Avatar
            src={user.photoURL}
            alt={user.displayName || user.email}
            className={classes.smallAvatar}
          >
            {(user.displayName || user.email || '?')[0].toUpperCase()}
          </Avatar>
        </div>
      </MiradorMenuButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleUserMenuClose}
        getContentAnchorEl={null}
        anchorOrigin={{
          horizontal: 'right',
          vertical: 'bottom',
        }}
        transformOrigin={{
          horizontal: 'right',
          vertical: 'top',
        }}
      >
        <MenuItem disabled>
          <Typography variant="body2">
            {user.displayName || user.email}
          </Typography>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogoutClick}>
          <ListItemIcon>
            <ExitToAppIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="ログアウト" />
        </MenuItem>
      </Menu>
    </>
  ) : (
    <>
      <MiradorMenuButton
        aria-label="Login"
        onClick={() => setShowDialog(true)}
        size="small"
      >
        <AccountCircleIcon />
      </MiradorMenuButton>

      <Dialog
        open={showDialog}
        onClose={handleClose}
        aria-labelledby="login-dialog-title"
      >
        <DialogTitle id="login-dialog-title">
          {isSignUp ? 'アカウント作成' : 'ログイン'}
        </DialogTitle>
        <DialogContent className={classes.dialogContent}>
          <Button
            variant="contained"
            className={classes.googleButton}
            // startIcon={<GoogleIcon />}
            onClick={handleLogin}
            fullWidth
          >
            Googleでログイン
          </Button>

          <div className={classes.dividerContainer}>
            <Divider className={classes.divider} />
            <Typography className={classes.dividerText}>または</Typography>
            <Divider className={classes.divider} />
          </div>

          <form onSubmit={handleEmailAuth} className={classes.form}>
            <TextField
              label="メールアドレス"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
            />
            <TextField
              label="パスワード"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
            />
            {error && (
              <Typography className={classes.errorText}>
                {error}
              </Typography>
            )}
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
            >
              {isSignUp ? 'アカウント作成' : 'ログイン'}
            </Button>
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsSignUp(!isSignUp)}>
            {isSignUp ? 'ログインへ' : 'アカウント作成へ'}
          </Button>
          <Button onClick={handleClose} color="primary">
            閉じる
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

GoogleAuthButton.propTypes = {
  canvases: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
    }),
  ).isRequired,
  config: PropTypes.shape({
    annotation: PropTypes.shape({
      adapter: PropTypes.func.isRequired,
    }).isRequired,
  }).isRequired,
  receiveAnnotation: PropTypes.func.isRequired,
};

const mapDispatchToProps = {
  receiveAnnotation: actions.receiveAnnotation,
};

export default connect(null, mapDispatchToProps)(GoogleAuthButton);
