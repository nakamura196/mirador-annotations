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
import { MiradorMenuButton, receiveAnnotation } from 'mirador';
import {
  AccountCircle as AccountCircleIcon,
  ExitToApp as ExitToAppIcon,
} from '@mui/icons-material';
import { connect } from 'react-redux';
import {
  Avatar,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';

/**
 * Googleアカウントとメールでの認証を管理するボタンコンポーネント
 */
function GoogleAuthButton({ canvases, config, receiveAnnotation }) {
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

  /** Googleアカウントでログインする */
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

  /** ログアウトする */
  const handleLogout = () => {
    signOut(getAuth())
      .catch((err) => console.error('ログアウトエラー:', err));
  };

  /** メールアドレスでログインまたはサインアップする */
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

  /** ダイアログを閉じる */
  const handleClose = () => {
    setShowDialog(false);
    setError('');
    setEmail('');
    setPassword('');
  };

  /** ユーザーメニューをクリックする */
  const handleUserMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  /** ユーザーメニューを閉じる */
  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  /** ログアウトする */
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
        sx={{ p: 0.5, '&:hover': { backgroundColor: 'transparent' } }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar
            src={user.photoURL}
            alt={user.displayName || user.email}
            sx={{ width: 24, height: 24 }}
          >
            {(user.displayName || user.email || '?')[0].toUpperCase()}
          </Avatar>
        </div>
      </MiradorMenuButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleUserMenuClose}
        disableAutoFocusItem
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
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 300 }}>
          <Button
            variant="contained"
            sx={{ backgroundColor: '#4285f4', '&:hover': { backgroundColor: '#357ae8' } }}
            onClick={handleLogin}
            fullWidth
          >
            Googleでログイン
          </Button>

          <div style={{ display: 'flex', alignItems: 'center', margin: '16px 0' }}>
            <Divider sx={{ flex: 1 }} />
            <Typography sx={{ mx: 2, color: 'text.secondary' }}>または</Typography>
            <Divider sx={{ flex: 1 }} />
          </div>

          <form onSubmit={handleEmailAuth} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
              <Typography sx={{ color: 'error.main', mt: 1 }}>
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

const mapDispatchToProps = (dispatch) => ({
  receiveAnnotation: (targetId, id, annotation) => dispatch(
    receiveAnnotation(targetId, id, annotation),
  ),
});

export default connect(null, mapDispatchToProps)(GoogleAuthButton);
