import React, { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  getAuth,
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  onAuthStateChanged,
} from 'firebase/auth';
import { MiradorMenuButton } from 'mirador/dist/es/src/components/MiradorMenuButton';
import AccountCircleIcon from '@material-ui/icons/AccountCircle';
import ExitToAppIcon from '@material-ui/icons/ExitToApp';
import { connect } from 'react-redux';
import * as actions from 'mirador/dist/es/src/state/actions';

/**
 * Googleアカウントでの認証を管理するボタンコンポーネント
 * @param {Object} props
 * @param {Array} props.canvases - キャンバスの配列
 * @param {Object} props.config - 設定オブジェクト
 * @param {Function} props.receiveAnnotation - アノテーションを受け取るコールバック
 */
function GoogleAuthButton({ canvases, config, receiveAnnotation }) {
  const [user, setUser] = useState(null);

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
    signInWithPopup(getAuth(), new GoogleAuthProvider()).catch((error) => console.error('ログインエラー:', error));
  };

  /**
   * ログアウトする
   */
  const handleLogout = () => {
    signOut(getAuth()).catch((error) => console.error('ログアウトエラー:', error));
  };

  return user ? (
    <MiradorMenuButton
      aria-label="Logout"
      onClick={handleLogout}
      size="small"
    >
      <ExitToAppIcon />
    </MiradorMenuButton>
  ) : (
    <MiradorMenuButton
      aria-label="Login with Google"
      onClick={handleLogin}
      size="small"
    >
      <AccountCircleIcon />
    </MiradorMenuButton>
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
