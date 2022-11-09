import styles from "./../assets/scss/Loader.module.scss";

export type LoaderProps = {
	message?: string;
};

const DEFAULT_MESSAGE = "Loading...";

export default function Loader({ message = DEFAULT_MESSAGE }: LoaderProps) {
	return (
		<div className={styles["loader-wrapper"]}>
			<p>{message}</p>
			<div className={styles["lds-spinner"]}>
				<div></div>
				<div></div>
				<div></div>
				<div></div>
				<div></div>
				<div></div>
				<div></div>
				<div></div>
				<div></div>
				<div></div>
				<div></div>
				<div></div>
			</div>
		</div>
	);
}
